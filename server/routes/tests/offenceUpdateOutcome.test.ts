import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import dayjs from 'dayjs'
import type { CourtAppearance } from 'models'
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
    const outcomeUuid = '123'
    defaultServices.courtAppearanceService.getWarrantType.mockReturnValue('NON_SENTENCING')
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      offenceCode: 'CC12345',
    })
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
    defaultServices.refDataService.getAllChargeOutcomes.mockResolvedValue([
      {
        outcomeUuid: '1',
        outcomeType: 'NON_SENTENCING',
        displayOrder: 10,
        nomisCode: '10',
        outcomeName: 'Offence outcome',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
    ])
    defaultServices.refDataService.getAppearanceOutcomeByUuid.mockResolvedValue({
      outcomeUuid: '123',
      outcomeType: 'NON_SENTENCING',
      displayOrder: 10,
      isSubList: false,
      nomisCode: '10',
      outcomeName: 'Appearance sentencing outcome',
      relatedChargeOutcomeUuid: '3',
      dispositionCode: 'FINAL',
      status: 'ACTIVE',
      warrantType: 'NON_SENTENCING',
    })
    const courtAppearance = {
      warrantType: 'NON_SENTENCING',
      caseReferenceNumber: 'T12345678',
      warrantDate: new Date(),
      courtCode: 'ACCRYC',
      appearanceOutcomeUuid: outcomeUuid,
      caseOutcomeAppliedAll: 'false',
    } as CourtAppearance
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue(courtAppearance)
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/0/update-offence-outcome')
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
