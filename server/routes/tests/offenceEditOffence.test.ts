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

describe('GET Edit offence', () => {
  it('should render page on new journey', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'REMAND',
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Accept changes')
      })
  })

  it('should render missing period length types to enter', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceReference: '111-222-333',
        sentenceUuid: '111-222-333',
        periodLengths: [],
        sentenceTypeId: '56',
      },
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
    })
    defaultServices.remandAndSentencingService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '56',
      description: 'SDS',
      classification: 'STANDARD',
      displayOrder: 10,
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const enterPeriodLengthLink = $('[data-qa=edit-period-length-SENTENCE_LENGTH-1]').text()
        expect(enterPeriodLengthLink).toContain('Enter sentence length')
      })
  })
})
