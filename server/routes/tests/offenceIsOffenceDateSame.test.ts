import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import dayjs from 'dayjs'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Is Offence date Same', () => {
  it('should render page on new journey', async () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '2',
      offenceCode: '123',
      replicatedFromUuid: '1',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
      offences: [
        {
          chargeUuid: '1',
          offenceCode: '123',
          offenceStartDate: new Date(),
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceByCode.mockResolvedValue({
      id: 0,
      code: '123',
      description: 'A offence description',
      offenceType: 'A',
      revisionId: 0,
      startDate: dayjs().subtract(10, 'days').format('YYYY-MM-DD'),
      endDate: dayjs().add(2, 'days').format('YYYY-MM-DD'),
      changedDate: dayjs().subtract(2, 'days').format('YYYY-MM-DD'),
      isChild: false,
    })
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/is-offence-date-same')
      .expect('Content-Type', /html/)
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
