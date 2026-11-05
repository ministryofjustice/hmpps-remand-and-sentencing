import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express
const originalMultipleOffenceInstances = config.featureToggles.multipleOffenceInstances
const originalChargeValue = config.featureToggles.chargeValue

const setup = (sentencing = false) => {
  defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
    appearanceUuid: '1',
    warrantType: sentencing ? 'SENTENCING' : 'NON_SENTENCING',
    courtCode: 'CRT',
    offences: [
      {
        chargeUuid: '2',
        offenceCode: 'O1',
        outcomeUuid: '3',
      },
    ],
  })
  defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
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
      outcomeType: sentencing ? 'SENTENCING' : 'REMAND',
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
  config.featureToggles.multipleOffenceInstances = originalMultipleOffenceInstances
  config.featureToggles.chargeValue = originalChargeValue
  jest.resetAllMocks()
})

describe('GET Check offence answers page', () => {
  it.each([true, false])('renders the custodial duplicate link only when the flag is enabled: %s', async enabled => {
    config.featureToggles.multipleOffenceInstances = enabled
    setup(true)

    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      .expect(200)
    const $ = cheerio.load(res.text)
    const duplicateLink = $('[data-qa="custodialOffences"] [data-qa="duplicate-offence-link-2"]')

    expect(duplicateLink.length).toBe(enabled ? 1 : 0)
    if (enabled) {
      expect(duplicateLink.closest('.offence-card-offence-details [data-qa="offenceCardList"]').length).toBe(1)
      expect(duplicateLink.closest('[data-qa="offenceCardList"]').prev('[data-qa="offenceSummaryList"]').length).toBe(1)
      expect($('.offence-card-actions [data-qa="duplicate-offence-link-2"]').length).toBe(0)
      expect(duplicateLink.text().trim()).toBe('Duplicate this offence')
      expect(duplicateLink.attr('href')).toBe(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/2/duplicate-offence',
      )
    }
  })

  it('should render page on new journey', async () => {
    setup()
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
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

  it('should render add multiple counts link in offence card on new non sentencing journey', async () => {
    app = appWithAllRoutes({})
    setup()
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const offenceCardList = $('[data-qa="offenceCardList"]').text()
    expect(offenceCardList).toContain('Add multiple counts')
  })

  it.each([true, false])(
    'renders value in offence card only when chargeValue flag is enabled (%s) and offence is sentenced with offenceValue',
    async enabled => {
      config.featureToggles.chargeValue = enabled
      setup(true)
      defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
        appearanceUuid: '1',
        warrantType: 'SENTENCING',
        courtCode: 'CRT',
        offences: [
          {
            chargeUuid: '2',
            offenceCode: 'O1',
            outcomeUuid: '3',
            offenceValue: 1250,
            hasOffenceValue: 'true',
            sentence: {
              sentenceUuid: 's1',
            },
          },
        ],
      })
      const res = await request(app)
        .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
        .expect(200)
      const $ = cheerio.load(res.text)
      const valueRow = $('[data-qa="offenceSummaryList"] .govuk-summary-list__row').filter(
        (_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Value',
      )
      expect(valueRow.length).toBe(enabled ? 1 : 0)
      if (enabled) {
        expect(valueRow.find('.govuk-summary-list__value').text().trim()).toBe('£1250')
      }
    },
  )

  it('should not render value in offence card when sentenced offence has no offenceValue', async () => {
    config.featureToggles.chargeValue = true
    setup(true)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      courtCode: 'CRT',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'O1',
          outcomeUuid: '3',
          hasOffenceValue: 'false',
          sentence: {
            sentenceUuid: 's1',
          },
        },
      ],
    })
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      .expect(200)
    const $ = cheerio.load(res.text)
    const valueRow = $('[data-qa="offenceSummaryList"] .govuk-summary-list__row').filter(
      (_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Value',
    )
    expect(valueRow.length).toBe(0)
  })

  it('should not render value in offence card for non-sentencing offence', async () => {
    config.featureToggles.chargeValue = true
    setup()
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'NON_SENTENCING',
      courtCode: 'CRT',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'O1',
          outcomeUuid: '3',
          offenceValue: 1250,
          hasOffenceValue: 'true',
        },
      ],
    })
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      .expect(200)
    const $ = cheerio.load(res.text)
    const valueRow = $('[data-qa="offenceSummaryList"] .govuk-summary-list__row').filter(
      (_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Value',
    )
    expect(valueRow.length).toBe(0)
  })
})
