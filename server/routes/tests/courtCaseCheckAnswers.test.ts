import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import type { CourtAppearance } from 'models'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import CourtAppearanceService from '../../services/courtAppearanceService'
import CourtRegisterService from '../../services/courtRegisterService'
import type { CourtDto } from '../../@types/courtRegisterApi/types'
import { AppearanceOutcome } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'
import AppearanceOutcomeService from '../../services/appearanceOutcomeService'

jest.mock('../../services/courtAppearanceService')
jest.mock('../../services/courtRegisterService')
jest.mock('../../services/appearanceOutcomeService')

const courtAppearanceService = new CourtAppearanceService(null, null, null) as jest.Mocked<CourtAppearanceService>
const courtRegisterService = new CourtRegisterService(null) as jest.Mocked<CourtRegisterService>
const appearanceOutcomeService = new AppearanceOutcomeService(null) as jest.Mocked<AppearanceOutcomeService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      courtAppearanceService,
      courtRegisterService,
      appearanceOutcomeService,
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Court Case Check Answers', () => {
  it('should render page on new journey', () => {
    const courtCode = 'ACCRYC'
    const outcomeUuid = '1'
    const appearanceOutcome = {
      outcomeUuid,
      outcomeName: 'Appearance outcome',
    } as AppearanceOutcome
    const courtAppearance = {
      warrantType: 'REMAND',
      caseReferenceNumber: 'T12345678',
      warrantDate: new Date(),
      courtCode: 'ACCRYC',
      appearanceOutcomeUuid: outcomeUuid,
      caseOutcomeAppliedAll: 'false',
    } as CourtAppearance
    const court = {
      courtId: courtCode,
      courtName: 'A court',
    } as CourtDto
    courtAppearanceService.getSessionCourtAppearance.mockReturnValue(courtAppearance)
    courtRegisterService.findCourtById.mockResolvedValue(court)
    appearanceOutcomeService.getOutcomeByUuid.mockResolvedValue(appearanceOutcome)

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-answers')
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
