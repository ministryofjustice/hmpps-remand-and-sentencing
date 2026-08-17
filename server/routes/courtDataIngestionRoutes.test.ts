import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from './testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET review new documents landing', () => {
  it('renders each document with a view-document link and its type description', () => {
    defaultServices.remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
      courtCaseReference: 'CASE123',
      warrantType: 'NON_SENTENCING',
      charges: [],
      documents: [
        { documentUUID: 'doc-uuid-1', fileName: 'aRemandWarrant.pdf', documentType: 'HMCTS_WARRANT' },
        { documentUUID: 'doc-uuid-2', fileName: 'mystery.pdf', documentType: 'SOMETHING_UNMAPPED' },
      ],
      periodLengths: [],
    } as never)
    defaultServices.courtDataIngestionService.getCourtHearing.mockResolvedValue({
      hearingId: 'abf395c2-8e3c-419c-bd9c-71d544e5d811',
      courtName: 'Liverpool Crown Court',
      courtId: '9b583616-049b-30f9-a14f-028a53b7cfe8',
      courtCode: 'LVRPCC',
      hearingDate: '2026-06-23T12:30:00',
      caseReferences: ['28DI3664010'],
      hearingType: 'Trial',
      documents: [
        {
          documentType: 'PRISON_COURT_REGISTER',
          documentId: 'doc-uuid-1',
          ingestionAt: '2026-06-23T12:44:22.488095',
        },
      ],
    } as never)

    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/landing')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(defaultServices.remandAndSentencingService.getHmctsCourtData).toHaveBeenCalledWith(
          'hearing1',
          'A1234AB',
          'user1',
        )

        const $ = cheerio.load(res.text)

        const firstLink = $('a[href*="/api/document/doc-uuid-1/view-document/"]')
        expect(firstLink.length).toBe(1)
        expect(firstLink.text()).toContain('aRemandWarrant.pdf')

        expect(res.text).toContain('Remand warrant')
        expect(res.text).toContain('Unknown document type')
        expect(res.text).toContain('Trial')
      })
  })
})

describe('GET review new documents start', () => {
  const appearance = {
    appearanceUuid: 'original-uuid',
    courtCaseReference: 'CASE123',
    warrantType: 'NON_SENTENCING',
    charges: [],
    documents: [],
    periodLengths: [],
  }

  it('clears session state and redirects to the overall case outcome page when there is no outcome', () => {
    defaultServices.remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
      ...appearance,
      outcome: undefined,
    } as never)

    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/start')
      .expect(302)
      .expect(
        'Location',
        /^\/person\/A1234AB\/add-court-case\/[0-9a-f-]+\/add-court-appearance\/[0-9a-f-]+\/overall-case-outcome$/,
      )
      .expect(() => {
        expect(defaultServices.courtAppearanceService.clearSessionCourtAppearance).toHaveBeenCalled()
        expect(defaultServices.offenceService.clearAllOffences).toHaveBeenCalled()
        expect(defaultServices.courtAppearanceService.setSessionCourtAppearance).toHaveBeenCalled()
      })
  })

  it('redirects to the task list when the appearance already has an outcome', () => {
    defaultServices.remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
      ...appearance,
      outcome: { outcomeUuid: 'outcome-1' },
    } as never)

    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/start')
      .expect(302)
      .expect(
        'Location',
        /^\/person\/A1234AB\/add-court-case\/[0-9a-f-]+\/add-court-appearance\/[0-9a-f-]+\/task-list$/,
      )
  })
})

describe('GET review new documents landing headings', () => {
  const stubLandingServices = () => {
    defaultServices.remandAndSentencingService.getHmctsCourtData.mockResolvedValue({
      courtCaseReference: 'CASE123',
      warrantType: 'NON_SENTENCING',
      charges: [],
      documents: [],
      periodLengths: [],
    } as never)
    defaultServices.courtDataIngestionService.getCourtHearing.mockResolvedValue({
      hearingId: 'hearing1',
      documents: [],
    } as never)
  }

  it('asks the user to choose how to add information on the existing case variant', () => {
    stubLandingServices()
    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/landing/existing-case')
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toStrictEqual('Review new documents and choose how you want to add information')
      })
  })

  it('keeps the add a court case heading when there is no choice to make', () => {
    stubLandingServices()
    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/landing')
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toStrictEqual('Review new documents and add a court case')
      })
  })
})
