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

describe('GET Update offence outcomes', () => {
  it('should render page on repeat journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      offences: [],
      overallSentenceLength: {
        years: '4',
        months: '5',
        weeks: '3',
        days: '2',
        periodOrder: ['years', 'months', 'weeks', 'days'],
        periodLengthType: 'OVERALL_SENTENCE_LENGTH',
      },
      hasOverallSentenceLength: 'true',
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getSentenceTypeMap.mockResolvedValue({})
    defaultServices.offenceOutcomeService.getOutcomeMap.mockResolvedValue({})
    defaultServices.calculateReleaseDatesService.compareOverallSentenceLength.mockResolvedValue({
      custodialLength: { years: 0, months: 0, weeks: 0, days: 0 },
      custodialLengthMatches: false,
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/update-offence-outcomes')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Continue')
        expect($('[data-qa="overallSentenceLengthComparison"]').length).toBeGreaterThan(0)
      })
  })
})
