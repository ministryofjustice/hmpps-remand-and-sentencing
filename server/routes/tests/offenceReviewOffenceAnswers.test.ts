import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express

const setup = () => {
  defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
    appearanceUuid: '1',
    warrantType: 'NON_SENTENCING',
    courtCode: 'CRT',
    offences: [
      {
        chargeUuid: '2',
        offenceCode: 'O1',
        outcomeUuid: '3',
        updatedOutcome: true,
      },
    ],
  })
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
    O1: 'Offence name',
  })
  defaultServices.refDataService.getSentenceTypeMap.mockResolvedValue({})
  defaultServices.refDataService.getChargeOutcomeMap.mockResolvedValue({
    '3': {
      outcomeUuid: '3',
      outcomeName: 'Outcome name',
      displayOrder: 1,
      dispositionCode: 'INTERIM',
      nomisCode: '56',
      outcomeType: 'REMAND',
      status: 'ACTIVE',
    },
  })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
    CRT: 'Court Name',
  })
}

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Review offence answers page', () => {
  it('should render page on repeat journey', async () => {
    setup()
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/review-offences')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const prisonerBanner = $('.mini-profile').text()
    expect(prisonerBanner).toContain('Meza, Cormac')
    expect(prisonerBanner).toContain('A1234AB')
    expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
    expect(prisonerBanner).toContain('Cell numberCELL-1')
    const addAnotherButton = $('[data-qa="addAnotherOffence"]').text()
    expect(addAnotherButton).toContain('Add an offence')
  })

  it('should render add multiple counts link in offence card after updating outcome', async () => {
    config.featureToggles.replicateOffence = true
    app = appWithAllRoutes({})
    setup()
    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/review-offences')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const offenceCardList = $('[data-qa="offenceCardList"]').text()
    expect(offenceCardList).toContain('Add multiple counts')
  })
})
