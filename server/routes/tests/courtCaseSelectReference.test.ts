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

describe('GET Select reference', () => {
  it('should render page on repeat journey', () => {
    defaultServices.remandAndSentencingService.getLatestCourtAppearanceByCourtCaseUuid.mockResolvedValue({
      appearanceUuid: '1',
      appearanceDate: '2025-07-25',
      courtCode: 'ACCRYC',
      warrantType: 'NON_SENTENCING',
      courtCaseReference: 'A123',
      outcome: {
        outcomeUuid: '1',
        outcomeName: 'Appearance outcome',
        displayOrder: 10,
        isSubList: false,
        nomisCode: '10',
        outcomeType: 'NON_SENTENCING',
        relatedChargeOutcomeUuid: '1',
        dispositionCode: 'INTERIM',
      },
      charges: [
        {
          chargeUuid: '1',
          offenceCode: 'OFF123',
          offenceStartDate: '2025-01-01',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
            displayOrder: 10,
            dispositionCode: 'F',
            nomisCode: '15',
            outcomeType: 'NON_SENTENCING',
            status: 'ACTIVE',
          },
        },
      ],
      documents: [],
      source: 'DPS',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantDate: new Date(),
    })
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/select-reference')
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
