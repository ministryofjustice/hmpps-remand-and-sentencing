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

describe('GET court name', () => {
  it('should render page on new journey', () => {
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
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

describe('POST court name', () => {
  it('should render error when no value submitted', () => {
    return request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
      .send({})
      .redirects(1)
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const errorSummary = $('.govuk-error-summary')
          .text()
          .trim()
          .replace(/\s{2,}/g, ' ')
        expect(errorSummary).toEqual('There is a problem You must enter the court name')
      })
  })
})
