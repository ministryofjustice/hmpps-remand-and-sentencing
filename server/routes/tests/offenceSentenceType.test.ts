import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import dayjs from 'dayjs'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Offence Sentence Type', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({})
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      offenceStartDate: dayjs({ date: 10, month: 5, year: 2023 }).toDate(),
      sentence: {
        sentenceReference: '0',
        convictionDate: dayjs({ date: 12, month: 5, year: 2023 }).toDate(),
      },
    })
    defaultServices.remandAndSentencingService.getSentenceTypes.mockResolvedValue([
      {
        sentenceTypeUuid: '1',
        description: 'A sentence type',
        classification: 'STANDARD',
        displayOrder: 10,
      },
    ])
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
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
      })
  })
})
