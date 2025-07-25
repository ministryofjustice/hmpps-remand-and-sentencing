import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import CourtAppearanceService from '../../services/courtAppearanceService'
import AppearanceOutcomeService from '../../services/appearanceOutcomeService'
import { AppearanceOutcome } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

jest.mock('../../services/courtAppearanceService')
jest.mock('../../services/appearanceOutcomeService')

const courtAppearanceService = new CourtAppearanceService(null, null, null) as jest.Mocked<CourtAppearanceService>
const appearanceOutcomeService = new AppearanceOutcomeService(null) as jest.Mocked<AppearanceOutcomeService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      courtAppearanceService,
      appearanceOutcomeService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Court Case Case Outcome applied all', () => {
  it('should render page on new journey', () => {
    const outcomeUuid = '1'
    const appearanceOutcome = {
      outcomeUuid,
      outcomeName: 'Appearance outcome',
    } as AppearanceOutcome
    courtAppearanceService.getAppearanceOutcomeUuid.mockReturnValue(outcomeUuid)
    appearanceOutcomeService.getOutcomeByUuid.mockResolvedValue(appearanceOutcome)

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/case-outcome-applied-all')
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
