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

describe('GET /sentencing/appearance-details', () => {
  it('Displays correct consecutive to details if consecutive to another case', async () => {
    defaultServices.courtAppearanceService.sessionCourtAppearanceExists.mockReturnValue(true)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '999',
          },
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getSentenceTypeMap.mockResolvedValue({})
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          courtCode: 'ACCRYC',
          appearanceDate: '2023-05-01',
          offenceCode: 'AB1234',
          sentenceUuid: '999',
        },
      ],
    })
    defaultServices.courtAppearanceService.getUploadedDocuments.mockReturnValue([])
    defaultServices.offenceOutcomeService.getOutcomeMap.mockResolvedValue({
      '123': {
        outcomeUuid: '123',
        outcomeName: 'Guilty',
        nomisCode: 'G',
        outcomeType: 'CONVICTION',
        displayOrder: 1,
        dispositionCode: 'CONVICTED',
      },
    })

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/appearance-details')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const offenceSummaryLists = $('[data-qa="offenceSummaryList"]')
        const lastOffenceSummaryList = offenceSummaryLists.first()
        const consecutiveText = lastOffenceSummaryList
          .find('.govuk-summary-list__row')
          .filter((_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Consecutive or concurrent')
          .find('.govuk-summary-list__value')
          .text()
          .trim()

        expect(consecutiveText).toContain('Consecutive to AB1234')
      })
  })
})
