import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import dayjs from 'dayjs'
import type { CourtAppearance } from 'models'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET Offence outcome', () => {
  it('should render page on new journey', () => {
    const outcomeUuid = '123'
    defaultServices.courtAppearanceService.getWarrantType.mockReturnValue('NON_SENTENCING')
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
    defaultServices.refDataService.getPrimaryNonCustodialChargeOutcomes.mockResolvedValue({
      primaryOutcomes: [
        {
          outcomeUuid: '1',
          outcomeType: 'NON_SENTENCING',
          displayOrder: 10,
          nomisCode: '10',
          outcomeName: 'Offence outcome',
          dispositionCode: 'F',
          status: 'ACTIVE',
        },
      ],
      nonCustodialOutcomes: [],
      allOutcomes: [
        {
          outcomeUuid: '1',
          outcomeType: 'NON_SENTENCING',
          displayOrder: 10,
          nomisCode: '10',
          outcomeName: 'Offence outcome',
          dispositionCode: 'F',
          status: 'ACTIVE',
        },
      ],
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
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
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

describe('Add custodial sentence on repeat journey (Remand to Imprisonment)', () => {
  afterEach(() => {
    config.featureToggles.chargeValue = false
  })

  it('redirects to offence-value page when selecting Imprisonment outcome for a newly added offence and renders offence hint and Yes/No radios', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(undefined)
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        nomisCode: '1002',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      offenceCode: 'CC12345',
      offenceStartDate: dayjs('2023-05-10').toDate(),
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
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

    await request(app)
      .post('/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/1/offence-outcome')
      .send({ offenceOutcome: '63920fee-e43a-45ff-a92d-4679f1af2527' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/1/offence-value')

    return request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/1/offence-value')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1.govuk-fieldset__heading').text().trim()).toBe('Is there a value for this offence?')
        expect($('[data-qa=offenceParagraph]').text().trim()).toBe(
          'CC12345 - An offence description committed on 10/05/2023',
        )
        expect($('input[name="hasOffenceValue"][value="true"]').length).toBe(1)
        expect($('input[name="hasOffenceValue"][value="false"]').length).toBe(1)
      })
  })
})
