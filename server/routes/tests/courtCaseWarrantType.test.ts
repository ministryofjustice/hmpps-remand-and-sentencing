import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET warrant type', () => {
  it('should render warrant type page on new journey', () => {
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
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
        const captionText = $('.govuk-caption-l').text()
        expect(captionText).toContain('Add a court case')
      })
  })

  it('should render warrant type page on repeat journey', () => {
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/warrant-type')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const captionText = $('.govuk-caption-l').text()
        expect(captionText).toContain('Add an appearance')
      })
  })
})
