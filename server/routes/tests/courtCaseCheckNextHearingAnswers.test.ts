import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import type { CourtAppearance } from 'models'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import type { CourtDto } from '../../@types/courtRegisterApi/types'
import { AppearanceType } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Check Next Hearing Answers', () => {
  it('should render page on new journey', () => {
    const courtCode = 'ACCRYC'
    const nextAppearanceTypeUuid = '1'
    const courtAppearance = {
      nextAppearanceSelect: true,
      nextAppearanceCourtCode: 'ACCRYC',
      nextAppearanceTypeUuid,
    } as CourtAppearance
    const court = {
      courtId: courtCode,
      courtName: 'A court',
    } as CourtDto
    const appearanceType = {
      appearanceTypeUuid: nextAppearanceTypeUuid,
      description: 'Appearance type',
    } as AppearanceType
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue(courtAppearance)
    defaultServices.courtRegisterService.findCourtById.mockResolvedValue(court)
    defaultServices.refDataService.getAppearanceTypeByUuid.mockResolvedValue(appearanceType)

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-next-hearing-answers')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Confirm and continue')
      })
  })
})
