import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import { PageCourtCaseContent } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

let app: Express

const courtCaseDetails = {
  courtCaseUuid: '1',
  prisonerId: 'A1234AB',
  status: 'ACTIVE',
  latestAppearance: {
    appearanceUuid: '1',
    courtCaseReference: '1234567',
    courtCode: 'ACCRYC',
    appearanceDate: '2025-07-25',
    charges: [],
    periodLengths: [],
  },
  appearances: [],
} as unknown as PageCourtCaseContent

beforeEach(() => {
  app = appWithAllRoutes({})
  defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCaseDetails)
  defaultServices.courtRegisterService.findCourtById.mockResolvedValue({
    courtId: 'ACCRYC',
    active: true,
    courtName: 'Aberdare County Court',
    buildings: [],
    type: {
      courtType: 'MAGISTRATE',
      courtName: 'Magistrate',
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

// The full navigation/validation/banner journeys for these pages are covered end-to-end by
// integration_tests/e2e/allFeaturesOn/courtCaseMarkAsActiveInactive.cy.ts. The tests below are kept
// where they verify something Cypress can't: exact service-call arguments, or edge-case data
// fixtures (e.g. a missing case reference) that aren't exercised by the e2e fixtures.

describe('GET /confirm-mark-court-case-as-inactive', () => {
  it('falls back to just the court name when the case has no reference', async () => {
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue({
      ...courtCaseDetails,
      latestAppearance: { ...courtCaseDetails.latestAppearance, courtCaseReference: null },
    } as unknown as PageCourtCaseContent)

    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="confirm-mark-court-case-status-subheading"]').text().trim()).toEqual('Aberdare County Court')
  })
})

describe('POST /confirm-mark-court-case-as-inactive', () => {
  it('navigates to the provide-a-reason page when Yes is chosen', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive.mockReturnValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .send({ confirmMarkCourtCaseStatus: 'true' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')

    expect(defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive).toHaveBeenCalledWith({
      confirmMarkCourtCaseStatus: 'true',
    })
  })
})

describe('POST /confirm-mark-court-case-as-active', () => {
  it('calls confirmMarkCourtCaseAsActive and navigates to the hearings page when Yes is chosen', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsActive.mockResolvedValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
      .send({ confirmMarkCourtCaseStatus: 'true' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/details')

    expect(defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsActive).toHaveBeenCalledWith('1', 'user1', {
      confirmMarkCourtCaseStatus: 'true',
    })
  })
})

describe('GET /cannot-mark-court-case-as-inactive-active-sentences', () => {
  it('renders the blocking page content', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/cannot-mark-court-case-as-inactive-active-sentences')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="cannot-mark-court-case-as-inactive-heading"]').text().trim()).toEqual(
      'You cannot mark a case with active sentences as inactive',
    )
    const bodyText = $('.govuk-grid-column-two-thirds').text()
    expect(bodyText).toContain('A case with active sentences cannot be marked as inactive.')
    expect(bodyText).toContain(
      'You need to inactivate all sentences in this case in order to mark the case as inactive.',
    )
    expect(bodyText).toContain('What to do next')
    expect(bodyText).toContain(
      'Edit the sentences on the latest court hearing to make them inactive. Then come back and try again.',
    )
  })
})

describe('GET /provide-reason-for-marking-court-case-as-inactive', () => {
  it('falls back to just the court name when the case has no reference', async () => {
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue({
      ...courtCaseDetails,
      latestAppearance: { ...courtCaseDetails.latestAppearance, courtCaseReference: null },
    } as unknown as PageCourtCaseContent)

    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="provide-reason-for-marking-court-case-as-inactive-hint"]').text().trim()).toEqual(
      'Aberdare County Court',
    )
  })
})

describe('POST /provide-reason-for-marking-court-case-as-inactive', () => {
  it('marks the case as inactive, sets the success banner and redirects to the hearings page', async () => {
    defaultServices.remandAndSentencingService.markCourtCaseAsInactive.mockResolvedValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')
      .send({ reason: 'No longer required' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/details')

    expect(defaultServices.remandAndSentencingService.markCourtCaseAsInactive).toHaveBeenCalledWith('1', 'user1', {
      reason: 'No longer required',
    })
  })

  it('redirects back to the same page with an error when the reason is over 200 characters', async () => {
    defaultServices.remandAndSentencingService.markCourtCaseAsInactive.mockResolvedValue([
      { text: 'Reason must be 200 characters or less', href: '#reason' },
    ])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')
      .send({ reason: 'a'.repeat(201) })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')

    expect(defaultServices.remandAndSentencingService.markCourtCaseAsInactive).toHaveBeenCalledWith('1', 'user1', {
      reason: 'a'.repeat(201),
    })
  })
})
