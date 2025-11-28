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

describe('GET Warrant Information Check Answers', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getWarrantType.mockReturnValue('REMAND')
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      appearanceOutcomeUuid: '123',
      caseOutcomeAppliedAll: 'true',
      overallConvictionDate: new Date(),
      overallConvictionDateAppliedAll: 'true',
      hasOverallSentenceLength: 'true',
      overallSentenceLength: {
        uuid: '2',
        years: '4',
        months: '5',
        periodOrder: ['years', 'months', 'weeks', 'days'],
        periodLengthType: 'OVERALL_SENTENCE_LENGTH',
      },
    })
    defaultServices.refDataService.getAppearanceOutcomeByUuid.mockResolvedValue({
      outcomeUuid: '123',
      outcomeType: 'SENTENCING',
      displayOrder: 10,
      isSubList: false,
      nomisCode: '10',
      outcomeName: 'Appearance sentencing outcome',
      relatedChargeOutcomeUuid: '3',
      dispositionCode: 'FINAL',
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/check-overall-answers')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=confirm-and-continue]').text()
        expect(continueButton).toContain('Confirm and continue')
      })
  })
})
