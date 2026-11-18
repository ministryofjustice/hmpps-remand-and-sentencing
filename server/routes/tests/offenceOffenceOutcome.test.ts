import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import dayjs from 'dayjs'
import type { CourtAppearance } from 'models'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express
const originalChargeValue = config.featureToggles.chargeValue

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  config.featureToggles.chargeValue = originalChargeValue
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

describe('POST Offence outcome & Offence value routing', () => {
  it('redirects to offence-value when adding a non-custodial offence and chargeValue is enabled', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(undefined)
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '1',
        outcomeType: 'REMAND',
        displayOrder: 10,
        nomisCode: '10',
        outcomeName: 'Remanded in custody',
        dispositionCode: 'I',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '1',
    })

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
      .send({ offenceOutcome: '1' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')
  })

  it('does not force revisiting offence-value when switching a non-custodial offence with existing offenceValue to sentencing', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '1',
      offenceValue: 150,
      hasOffenceValue: 'true',
    })
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '2',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        nomisCode: '20',
        outcomeName: 'Imprisonment',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '2',
      offenceValue: 150,
      hasOffenceValue: 'true',
    })

    await request(app)
      .post(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome?submitToEditOffence=true',
      )
      .send({ offenceOutcome: '2' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/count-number')
  })

  it('does not redirect to offence-value when switching a non-custodial offence without offenceValue (null/undefined) to sentencing', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '1',
    })
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '2',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        nomisCode: '20',
        outcomeName: 'Imprisonment',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '2',
    })

    await request(app)
      .post(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome?submitToEditOffence=true',
      )
      .send({ offenceOutcome: '2' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/count-number')
  })

  it('does not redirect to offence-value when updating outcome via update-offence-outcome to sentencing', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.offenceService.getOutcomeUpdateChargeUuids.mockReturnValue([])
    defaultServices.offenceService.updateOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '2',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        nomisCode: '20',
        outcomeName: 'Imprisonment',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '2',
      offenceValue: null,
    })

    await request(app)
      .post('/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/0/update-offence-outcome')
      .send({ offenceOutcome: '2' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/0/add-court-appearance/0/offences/0/count-number')
  })

  it('treats offenceValue === -1 as hasOffenceValue = false and empty value when loading offence-value page', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      offenceValue: -1,
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      warrantType: 'NON_SENTENCING',
      caseOutcomeAppliedAll: 'false',
    } as CourtAppearance)
    defaultServices.manageOffencesService.getOffenceByCode.mockResolvedValue({
      id: 0,
      code: 'CC12345',
      description: 'An offence description',
      offenceType: 'A',
      revisionId: 0,
      startDate: '2020-01-01',
      endDate: '2030-01-01',
      changedDate: '2020-01-01',
      isChild: false,
    })

    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')
      .expect(200)
    const $ = cheerio.load(res.text)
    expect($('input[name="hasOffenceValue"][value="false"]').is(':checked')).toBe(true)
    expect($('#offenceValue').val()).toBeUndefined()
  })

  it('saves non-custodial offence to appearance after submitting offence-value', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.offenceService.setOffenceValue.mockReturnValue([])
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '1',
      offenceValue: 50,
      hasOffenceValue: 'true',
    })
    defaultServices.offenceService.getAllOffences.mockReturnValue([
      {
        chargeUuid: '0',
        offenceCode: 'CC12345',
        outcomeUuid: '1',
        offenceValue: 50,
        hasOffenceValue: 'true',
      },
    ])
    defaultServices.refDataService.getChargeOutcomeById.mockResolvedValue({
      outcomeUuid: '1',
      outcomeType: 'REMAND',
      displayOrder: 10,
      nomisCode: '10',
      outcomeName: 'Remanded in custody',
      dispositionCode: 'I',
      status: 'ACTIVE',
    })

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')
      .send({ hasOffenceValue: 'true', offenceValue: '50' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
  })

  it('redirects to offence-value when adding a custodial offence in add-court-case journey and chargeValue is enabled', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(undefined)
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '2',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        nomisCode: '20',
        outcomeName: 'Imprisonment',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '0',
      offenceCode: 'CC12345',
      outcomeUuid: '2',
    })

    await request(app)
      .post('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
      .send({ offenceOutcome: '2' })
      .expect(302)
      .expect('Location', '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')
  })

  it('redirects to offence-value when adding a custodial offence in edit-court-case journey and chargeValue is enabled', async () => {
    config.featureToggles.chargeValue = true
    defaultServices.courtAppearanceService.getOffence.mockReturnValue(undefined)
    defaultServices.courtAppearanceService.getSentenceUuidsInChain.mockReturnValue([])
    defaultServices.offenceService.setOffenceOutcome.mockResolvedValue({
      errors: [],
      outcome: {
        outcomeUuid: '2',
        outcomeType: 'SENTENCING',
        displayOrder: 10,
        nomisCode: '20',
        outcomeName: 'Imprisonment',
        dispositionCode: 'F',
        status: 'ACTIVE',
      },
      hasSentencesAfter: false,
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      offenceCode: 'CC12345',
      outcomeUuid: '2',
    })

    await request(app)
      .post('/person/A1234AB/edit-court-case/1/edit-court-appearance/1/offences/1/offence-outcome')
      .send({ offenceOutcome: '2' })
      .expect(302)
      .expect('Location', '/person/A1234AB/edit-court-case/1/edit-court-appearance/1/offences/1/offence-value')
  })
})
