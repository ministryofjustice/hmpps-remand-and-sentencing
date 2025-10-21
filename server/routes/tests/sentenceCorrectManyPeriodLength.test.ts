import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  setupDefaultOffence()
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

const setupDefaultOffence = () => {
  defaultServices.offenceService.getSessionOffence.mockReturnValue({
    chargeUuid: '1',
    offenceCode: '123',
    sentence: {
      sentenceUuid: '2',
      periodLengths: [
        {
          uuid: '5',
          years: '5',
          periodOrder: ['years', 'months', 'weeks', 'days'],
          periodLengthType: 'SENTENCE_LENGTH',
        },
        {
          uuid: '6',
          years: '6',
          periodOrder: ['years', 'months', 'weeks', 'days'],
          periodLengthType: 'SENTENCE_LENGTH',
        },
        {
          uuid: '7',
          years: '7',
          periodOrder: ['years', 'months', 'weeks', 'days'],
          periodLengthType: 'SENTENCE_LENGTH',
        },
      ],
    },
  })

  defaultServices.manageOffencesService.getOffenceByCode.mockResolvedValue({
    changedDate: '',
    code: '123',
    id: 1,
    isChild: false,
    revisionId: 1,
    startDate: '',
    description: 'Offence description',
  })
}

describe('GET Sentence correct many period lengths', () => {
  it('should render page', async () => {
    const res = await request(app)
      .get(
        '/person/A1234AB/edit-court-case/0/edit-court-appearance/0/offences/0/correct-many-period-length?periodLengthType=SENTENCE_LENGTH',
      )
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const prisonerBanner = $('.mini-profile').text()
    expect(prisonerBanner).toContain('Meza, Cormac')
    expect(prisonerBanner).toContain('A1234AB')
    expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
    expect(prisonerBanner).toContain('Cell numberCELL-1')
    const continueButton = $('[data-qa=continue-button]').text()
    expect(continueButton).toContain('Continue')
  })

  it('should go to alternative format page', async () => {
    const res = await request(app)
      .get(
        '/person/A1234AB/edit-court-case/0/edit-court-appearance/0/offences/1/correct-many-period-length?periodLengthType=SENTENCE_LENGTH',
      )
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const alternativeLink = $('[data-qa=alternative-format-link]').attr('href')
    const alternativeRes = await request(app).get(alternativeLink).expect('Content-Type', /html/)

    const alternative$ = cheerio.load(alternativeRes.text)
    const title = alternative$('.govuk-fieldset__legend--l').text()
    expect(title).toContain('Enter the sentence length')
  })
})
