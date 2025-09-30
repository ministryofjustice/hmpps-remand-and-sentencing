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

describe('GET Update Offence outcome', () => {
  it('should render page on repeat journey', () => {
    defaultServices.courtAppearanceService.getWarrantType.mockReturnValue('REMAND')
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
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
    defaultServices.refDataService.getAllChargeOutcomes.mockResolvedValue([
      {
        outcomeUuid: '1',
        outcomeType: 'REMAND',
        displayOrder: 10,
        nomisCode: '10',
        outcomeName: 'Offence outcome',
        dispositionCode: 'F',
      },
    ])
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
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
        const offenceParagraph = $('[data-qa=offenceParagraph]').text()
        expect(offenceParagraph).toContain('CC12345 - An offence description')
        expect($('[data-qa=legendParagraph]').length).toBe(0)
      })
  })
})
