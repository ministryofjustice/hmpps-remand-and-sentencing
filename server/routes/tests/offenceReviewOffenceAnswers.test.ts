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

describe('GET Review offence answers page', () => {
  it('should render page on repeat journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      offences: [],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getSentenceTypeMap.mockResolvedValue({})
    defaultServices.offenceOutcomeService.getOutcomeMap.mockResolvedValue({})
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/review-offences')
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
