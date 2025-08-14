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

describe('GET Sentencing delete sentence in chain', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getOffence.mockReturnValue({
      chargeUuid: '1',
      offenceCode: 'CC12345',
    })
    defaultServices.manageOffencesService.getOffenceByCode.mockResolvedValue({
      id: 0,
      code: 'CC12345',
      description: 'An offence description',
      offenceType: 'A',
      revisionId: 0,
      startDate: dayjs().subtract(10, 'days').format('YYYY-MM-DD'),
      endDate: dayjs().add(2, 'days').format('YYYY-MM-DD'),
      changedDate: dayjs().subtract(2, 'days').format('YYYY-MM-DD'),
      isChild: false,
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/0/delete-sentence-in-chain')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Yes, delete the sentence')
      })
  })
})
