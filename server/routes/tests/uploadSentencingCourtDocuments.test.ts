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

describe('GET Upload remand court document', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      warrantType: 'SENTENCING',
    })
    defaultServices.courtAppearanceService.getUploadedDocuments.mockReturnValue([])
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/upload-court-documents')
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
