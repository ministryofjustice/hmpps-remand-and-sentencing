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

describe('datafix admin', () => {
  it('GET should render page', () => {
    return request(app)
      .get('/admin/data-fix')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Continue')
      })
  })

  it('POST successfully should render success banner', () => {
    defaultServices.remandAndSentencingService.fixPrisonersManyChargesToSentence.mockResolvedValue(undefined)
    return request(app)
      .post('/admin/data-fix')
      .send({
        prisonerIds: 'PR1\nPR2',
      })
      .redirects(1)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const successBanner = $('[data-qa=success-banner]').text()
        expect(successBanner).toContain('Successfully kicked off fix')
      })
  })
})
