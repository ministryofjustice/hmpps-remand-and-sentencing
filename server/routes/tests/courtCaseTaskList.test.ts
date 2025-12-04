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

describe('GET task list', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getWarrantType.mockReturnValue('NON_SENTENCING')
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
      caseReferenceNumber: 'A123',
      appearanceOutcomeUuid: '546',
    })
    defaultServices.refDataService.getAppearanceOutcomeByUuid.mockResolvedValue({
      outcomeUuid: '546',
      displayOrder: 1,
      dispositionCode: 'INTERIM',
      isSubList: false,
      nomisCode: '9654',
      outcomeName: 'Remand in custody',
      outcomeType: 'NON_SENTENCING',
      relatedChargeOutcomeUuid: '789',
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/task-list')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Finish and save')
        expect($('[data-qa=back-link]').length).toBe(0)
      })
  })
})
