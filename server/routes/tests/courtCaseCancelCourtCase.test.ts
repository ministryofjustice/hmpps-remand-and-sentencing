import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET court name', () => {
  it('should render page on repeat journey', () => {
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/confirm-cancel-court-case')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const heading = $('h1').text()
        expect(heading).toContain('Are you sure you want to cancel adding a hearing?')
        const description = $('[data-qa=cancel-court-case-description]').text()
        expect(description).toContain(
          'You have not finished adding the information for the hearing. Any information you have entered will be lost.',
        )
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Continue')
      })
  })
})
