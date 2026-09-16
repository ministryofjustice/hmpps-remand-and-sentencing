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

describe('GET /confirm-mark-court-case-as-inactive', () => {
  it('renders the confirm page with the inactive wording and the case/court subheading', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="confirm-mark-court-case-status-heading"]').text().trim()).toEqual(
      'Are you sure you want to mark this court case as inactive?',
    )
    expect($('[data-qa="confirm-mark-court-case-status-subheading"]').text().trim()).toEqual(
      '1234567 at Aberdare County Court',
    )
    expect($('[data-qa="confirm-mark-court-case-status-yes"]').next().text().trim()).toEqual('Yes, mark as inactive')
    expect($('[data-qa="back-link"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
  })
})

describe('GET /confirm-mark-court-case-as-active', () => {
  it('renders the confirm page with the active wording', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="confirm-mark-court-case-status-heading"]').text().trim()).toEqual(
      'Are you sure you want to mark this court case as active?',
    )
    expect($('[data-qa="confirm-mark-court-case-status-yes"]').next().text().trim()).toEqual('Yes, mark as active')
  })
})

describe('POST /confirm-mark-court-case-as-inactive', () => {
  it('navigates to the provide-a-reason page when Yes is chosen', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive.mockResolvedValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .send({ confirmMarkCourtCaseStatus: 'true' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')

    expect(defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive).toHaveBeenCalledWith({
      confirmMarkCourtCaseStatus: 'true',
    })
  })

  it('navigates to the hearings page when No is chosen', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive.mockResolvedValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .send({ confirmMarkCourtCaseStatus: 'false' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/details')
  })

  it('redirects back to the same page with an error when no selection is made', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsInactive.mockResolvedValue([
      { text: "Select 'Yes' if you want to mark this court case as inactive", href: '#confirmMarkCourtCaseStatus' },
    ])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
      .send({})
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
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

  it('navigates to the hearings page with no banner when No is chosen', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsActive.mockResolvedValue([])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
      .send({ confirmMarkCourtCaseStatus: 'false' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/details')
  })

  it('redirects back to the same page with an error when no selection is made', async () => {
    defaultServices.remandAndSentencingService.confirmMarkCourtCaseAsActive.mockResolvedValue([
      { text: "Select 'Yes' if you want to mark this court case as active", href: '#confirmMarkCourtCaseStatus' },
    ])

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
      .send({})
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
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

  it('links the "Cancel and go back" button and the "Back" link to the page of entry', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/cannot-mark-court-case-as-inactive-active-sentences')
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="cancel-and-go-back-button"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
    expect($('[data-qa="back-link"]').attr('href')).toEqual('/person/A1234AB/edit-court-case/1/details')
  })
})

describe('GET /provide-reason-for-marking-court-case-as-inactive', () => {
  it('renders the stub page', async () => {
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/1/provide-reason-for-marking-court-case-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="provide-reason-for-marking-court-case-as-inactive-heading"]').text().trim()).toEqual(
      'Provide a reason you want to mark this case as inactive',
    )
    expect($('[data-qa="back-link"]').attr('href')).toEqual(
      '/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive',
    )
  })
})
