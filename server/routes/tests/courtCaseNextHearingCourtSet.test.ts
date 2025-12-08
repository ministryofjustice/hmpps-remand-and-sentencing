import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import type { CourtAppearance } from 'models'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import { CourtDto } from '../../@types/courtRegisterApi/types'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Next hearing been set', () => {
  it('should render page on new journey', () => {
    const courtCode = 'ACCRYC'
    const courtAppearance = {
      appearanceUuid: '1',
      courtCode,
    } as CourtAppearance
    const court = {
      courtId: courtCode,
      courtName: 'A court',
    } as CourtDto
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue(courtAppearance)
    defaultServices.courtRegisterService.findCourtById.mockResolvedValue(court)

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-court-select')
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
