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

describe('GET Check offence answers page', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      offences: [],
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({})
    defaultServices.refDataService.getSentenceTypeMap.mockResolvedValue({})
    defaultServices.refDataService.getChargeOutcomeMap.mockResolvedValue({})
    defaultServices.calculateReleaseDatesService.compareOverallSentenceLength.mockResolvedValue({
      custodialLength: { years: 0, months: 0, weeks: 0, days: 0 },
      custodialLengthMatches: true,
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const addAnotherButton = $('[data-qa="addAnotherOffence"]').text()
        expect(addAnotherButton).toContain('Add an offence')
      })
  })
})
