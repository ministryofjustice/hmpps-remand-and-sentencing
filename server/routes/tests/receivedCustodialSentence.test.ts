import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes } from '../testutils/appSetup'

const app: Express = appWithAllRoutes({})

describe('GET received custodial sentence', () => {
  it('should render page', () => {
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
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
        expect(captionText).toContain('Add a hearing')
        const radioOptions = $('.govuk-radios__label')
          .toArray()
          .map(radioLabelElement =>
            $(radioLabelElement)
              .text()
              .trim()
              .replace(/(\r\n|\n|\r)/gm, ''),
          )
        expect(radioOptions).toEqual(
          expect.arrayContaining(['Yes, Cormac Meza has received a custodial sentence', 'No']),
        )
      })
  })
})
