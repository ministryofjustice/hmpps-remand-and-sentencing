import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'

let app: Express
const sentenceStatusFeatureToggleWasEnabled = config.featureToggles.sentenceStatus

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
  config.featureToggles.sentenceStatus = sentenceStatusFeatureToggleWasEnabled
})

describe('GET /sentencing/hearing-details', () => {
  beforeEach(() => {
    defaultServices.courtAppearanceService.sessionCourtAppearanceExists.mockReturnValue(true)
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '999',
          },
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({})
    defaultServices.refDataService.getSentenceTypeMap.mockResolvedValue({})
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          courtCode: 'ACCRYC',
          appearanceDate: '2023-05-01',
          offenceCode: 'AB1234',
          sentenceUuid: '999',
        },
      ],
    })
    defaultServices.courtAppearanceService.getUploadedDocuments.mockReturnValue([])
    defaultServices.refDataService.getChargeOutcomeMap.mockResolvedValue({
      '123': {
        outcomeUuid: '123',
        outcomeName: 'Guilty',
        nomisCode: 'G',
        outcomeType: 'CONVICTION',
        displayOrder: 1,
        dispositionCode: 'CONVICTED',
        status: 'ACTIVE',
      },
    })
    defaultServices.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance.mockResolvedValue({
      hasSentenceAfterOnOtherCourtAppearance: false,
    })
  })
  it('Displays correct consecutive to details if consecutive to another case', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const offenceSummaryLists = $('[data-qa="offenceSummaryList"]')
        const lastOffenceSummaryList = offenceSummaryLists.first()
        const consecutiveText = lastOffenceSummaryList
          .find('.govuk-summary-list__row')
          .filter((_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Consecutive or concurrent')
          .find('.govuk-summary-list__value')
          .text()
          .trim()

        expect(consecutiveText).toContain('Consecutive to AB1234')
      })
  })

  it('displays has sentences after on other court appearances when true', () => {
    defaultServices.remandAndSentencingService.hasSentenceAfterOnOtherCourtAppearance.mockResolvedValue({
      hasSentenceAfterOnOtherCourtAppearance: true,
    })

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const hasSentenceAfterOnOtherCourtAppearanceInsetText = $(
          '[data-qa="hasSentenceAfterOnOtherCourtAppearanceInset"]',
        ).text()
        expect(hasSentenceAfterOnOtherCourtAppearanceInsetText).toContain(
          'One or more sentences on other cases are consecutive to a sentence on this case. If the consecutive status of a sentence is changed, check that any linked cases accurately reflect the correct warrant information.',
        )
      })
  })

  it('shows the Mark sentences as inactive button when there is an active sentence and the feature flag is enabled', async () => {
    config.featureToggles.sentenceStatus = true
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '999',
            status: 'ACTIVE',
          },
        },
      ],
    })

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="markSentencesAsInactive"]')).toHaveLength(1)
      })
  })

  it('does not show the Mark sentences as inactive button when the feature flag is disabled, even with an active sentence', async () => {
    config.featureToggles.sentenceStatus = false
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '999',
            status: 'ACTIVE',
          },
        },
      ],
    })

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="markSentencesAsInactive"]')).toHaveLength(0)
      })
  })

  it('does not show the Mark sentences as inactive button when there are no active sentences', async () => {
    config.featureToggles.sentenceStatus = true
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: 'appearance-uuid',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            countNumber: '1',
            sentenceServeType: 'CONSECUTIVE',
            sentenceTypeClassification: 'STANDARD',
            consecutiveToSentenceUuid: '999',
            status: 'INACTIVE',
          },
        },
      ],
    })

    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/hearing-details')
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('[data-qa="markSentencesAsInactive"]')).toHaveLength(0)
      })
  })
})

describe('GET /sentencing/select-sentences-to-mark-as-inactive', () => {
  it('renders the select sentences to mark as inactive page', async () => {
    await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/select-sentences-to-mark-as-inactive')
      .expect('Content-Type', /html/)
      .expect(200)
      .expect(res => {
        const $ = cheerio.load(res.text)
        expect($('h1').text().trim()).toEqual('Select the sentences to mark as inactive')
      })
  })
})
