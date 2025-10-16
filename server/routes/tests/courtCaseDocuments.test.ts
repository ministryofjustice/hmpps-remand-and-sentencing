import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Court case documents', () => {
  it('should render page', () => {
    defaultServices.courtCasesReleaseDatesService.getServiceDefinitions.mockResolvedValue({
      services: {
        overview: {
          href: 'http://localhost:8000/prisoner/AB1234AB/overview',
          text: 'Overview',
          thingsToDo: {
            count: 0,
          },
        },
        courtCases: {
          href: 'http://localhost:3007/person/AB1234AB',
          text: 'Court cases',
          thingsToDo: {
            count: 0,
          },
        },
      },
    })
    defaultServices.remandAndSentencingService.getPrisonerDocuments.mockResolvedValue({
      courtCaseDocuments: [
        {
          courtCaseUuid: '123',
          latestAppearance: {
            appearanceUuid: '456',
            courtCode: 'ACCRYC',
            appearanceDate: '2025-01-01',
            warrantType: 'REMAND',
            outcome: {
              outcomeUuid: '1',
              displayOrder: 10,
              isSubList: false,
              nomisCode: '345',
              outcomeName: 'Remanded in custody',
              outcomeType: 'REMAND',
              relatedChargeOutcomeUuid: '2',
            },
            charges: [],
            documents: [
              {
                documentType: 'HMCTS_WARRANT',
                fileName: 'aRemandWarrant.pdf',
                documentUUID: '567',
              },
            ],
            source: 'DPS',
          },
          appearanceDocumentsByType: {
            HMCTS_WARRANT: [
              {
                courtCode: 'ACCRYC',
                documentType: 'HMCTS_WARRANT',
                fileName: 'aRemandWarrant.pdf',
                warrantDate: '2025-01-01',
                warrantType: 'REMAND',
                documentUUID: '567',
                caseReference: 'CASE1',
              },
            ],
          },
        },
      ],
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'A court description',
    })
    return request(app)
      .get('/person/A1234AB/documents')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const documentDetails = $('[data-qa="document-details-567"]').text().trim()
        expect(documentDetails).toBe('aRemandWarrant.pdf on 01/01/2025 at A court description')
      })
  })
})
