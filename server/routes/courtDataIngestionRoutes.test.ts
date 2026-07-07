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
    } as never)

    return request(app)
      .get('/person/A1234AB/review-new-documents/hearing1/landing')
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(defaultServices.remandAndSentencingService.getHmctsCourtData).toHaveBeenCalledWith('hearing1', 'user1')

        const $ = cheerio.load(res.text)

        const firstLink = $('a[href*="/api/document/doc-uuid-1/view-document/"]')
        expect(firstLink.length).toBe(1)
        expect(firstLink.text()).toContain('aRemandWarrant.pdf')

        // HMCTS_WARRANT under a NON_SENTENCING warrant maps to the friendly name
        expect(res.text).toContain('Remand warrant')
        // a document type not in the resource falls back
        expect(res.text).toContain('Unknown document type')

        const continueButton = $('[data-qa=hmcts-court-data-continue]')
        expect(continueButton.attr('href')).toBe('/person/A1234AB/review-new-documents/hearing1/start')
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
