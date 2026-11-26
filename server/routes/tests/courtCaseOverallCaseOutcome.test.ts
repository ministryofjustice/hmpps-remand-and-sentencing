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

describe('Court Case Overall Case Outcome', () => {
  it('should render page on new journey without appearance details', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
    })
    defaultServices.refDataService.getAllAppearanceOutcomes.mockResolvedValue([
      {
        outcomeUuid: '1',
        outcomeType: 'NON_SENTENCING',
        displayOrder: 10,
        isSubList: false,
        nomisCode: '10',
        outcomeName: 'Appearance outcome',
        relatedChargeOutcomeUuid: '2',
        dispositionCode: 'INTERIM',
        status: 'ACTIVE',
        warrantType: 'NON_SENTENCING',
      },
    ])
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-case-outcome')
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
        const hearingDetails = $('[data-qa=hearingDetails]')
        expect(hearingDetails.length).toBe(0)
      })
  })

  it('should render page on repeat journey without appearance details', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
    })
    defaultServices.refDataService.getAllAppearanceOutcomes.mockResolvedValue([
      {
        outcomeUuid: '1',
        outcomeType: 'NON_SENTENCING',
        displayOrder: 10,
        isSubList: false,
        nomisCode: '10',
        outcomeName: 'Appearance outcome',
        relatedChargeOutcomeUuid: '2',
        dispositionCode: 'INTERIM',
        status: 'ACTIVE',
        warrantType: 'NON_SENTENCING',
      },
    ])
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/overall-case-outcome')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const hearingDetails = $('[data-qa=hearingDetails]')
        expect(hearingDetails.length).toBe(0)
      })
  })

  it('should render page on edit journey with appearance details', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
    })
    defaultServices.refDataService.getAllAppearanceOutcomes.mockResolvedValue([
      {
        outcomeUuid: '1',
        outcomeType: 'NON_SENTENCING',
        displayOrder: 10,
        isSubList: false,
        nomisCode: '10',
        outcomeName: 'Appearance outcome',
        relatedChargeOutcomeUuid: '2',
        dispositionCode: 'INTERIM',
        status: 'ACTIVE',
        warrantType: 'NON_SENTENCING',
      },
    ])
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/overall-case-outcome')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const hearingDetails = $('[data-qa=hearingDetails]')
        expect(hearingDetails.length).toBe(1)
      })
  })

  describe('missed hearing', () => {
    beforeEach(() => {
      defaultServices.courtAppearanceService.setAppearanceOutcomeUuid.mockResolvedValue([])
    })

    it('should go to select reference when the case has a reference', () => {
      defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
        appearanceUuid: '1',
        warrantType: 'NON_SENTENCING',
        isMissedHearing: true,
        offences: [],
      })
      defaultServices.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid.mockResolvedValue({
        courtCaseReference: 'REF1',
      } as never)
      return request(app)
        .post('/person/A1234AB/edit-court-case/0/add-court-appearance/1/overall-case-outcome')
        .type('form')
        .expect(302)
        .expect('Location', '/person/A1234AB/edit-court-case/0/add-court-appearance/1/select-reference')
    })

    it('should go to reference when the case has no reference', () => {
      defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
        appearanceUuid: '1',
        warrantType: 'NON_SENTENCING',
        isMissedHearing: true,
        offences: [],
      })
      defaultServices.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid.mockResolvedValue({} as never)
      return request(app)
        .post('/person/A1234AB/edit-court-case/0/add-court-appearance/1/overall-case-outcome')
        .type('form')
        .expect(302)
        .expect('Location', '/person/A1234AB/edit-court-case/0/add-court-appearance/1/reference')
    })
  })
})
