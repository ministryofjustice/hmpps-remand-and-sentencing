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

describe('GET Offence sentence length mismatch', () => {
  defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({})
  defaultServices.calculateReleaseDatesService.compareOverallSentenceLength.mockResolvedValue({
    custodialLength: { years: 0, months: 0, weeks: 0, days: 0 },
    custodialLengthMatches: false,
  })
  it('should render page on new journey', () => {
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/sentence-length-mismatch')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Yes, continue')
      })
  })
})
