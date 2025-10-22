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

describe('GET Edit offence', () => {
  it('should render page on new journey', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'REMAND',
      offences: [],
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Accept changes')
      })
  })

  it('should render missing period length types to enter', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '111-222-333',
        sentenceTypeId: '56',
      },
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })
    defaultServices.refDataService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '56',
      description: 'SDS',
      classification: 'STANDARD',
      displayOrder: 10,
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const enterPeriodLengthLink = $('[data-qa=edit-period-length-SENTENCE_LENGTH-1]').text()
        expect(enterPeriodLengthLink).toContain('Enter sentence length')
      })
  })

  it('should render sentence type call to action when no sentence type', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '111-222-333',
      },
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const enterSentenceTypeCallToActionLink = $('[data-qa=edit-sentence-type-cta]').text()
        expect(enterSentenceTypeCallToActionLink).toContain('Enter sentence type')
      })
  })

  it('should render missing consecutive to', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '111-222-333',
        sentenceTypeId: '56',
        sentenceServeType: 'CONSECUTIVE',
      },
    })
    defaultServices.refDataService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '56',
      description: 'SDS',
      classification: 'STANDARD',
      displayOrder: 10,
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const enterConsecutiveToLink = $('[data-qa=edit-consecutive-to-1]').text()
        expect(enterConsecutiveToLink).toContain('Enter details')
      })
  })

  it('should render consecutive to correctly when populated', () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '111-222-333',
        sentenceTypeId: '56',
        sentenceServeType: 'CONSECUTIVE',
        consecutiveToSentenceUuid: 'SENT123',
      },
    })
    defaultServices.refDataService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '56',
      description: 'SDS',
      classification: 'STANDARD',
      displayOrder: 10,
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          courtCode: null,
          appearanceDate: null,
          offenceStartDate: '2025-01-01',
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF456: 'Offence code description',
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })

    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)

        const consecutiveToText = $('.govuk-summary-list__row')
          .find('dt:contains("Consecutive to")')
          .next('.govuk-summary-list__value')
          .text()
          .trim()

        expect(consecutiveToText).toContain('OFF456 - Offence code description committed on 01/01/2025')
        const enterConsecutiveToLink = $('[data-qa=edit-consecutive-to-1]').text()
        expect(enterConsecutiveToLink).toContain('Edit')
      })
  })

  it('should render fine amount cta when sentence type is fine and no fine amount is entered', async () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '111-222-333',
        sentenceTypeId: '56',
      },
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })
    defaultServices.refDataService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '56',
      description: 'A Fine',
      classification: 'FINE',
      displayOrder: 20,
    })
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const enterFineAmountCtaLink = $('[data-qa=edit-fine-amount-cta]').text()
    expect(enterFineAmountCtaLink).toContain('Enter fine amount')
  })

  it('should render offence date cta when no offence dates', async () => {
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
    })
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [],
    })
    const res = await request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/edit-offence')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const enterOffenceDateCtaLink = $('[data-qa=edit-offence-date-cta]').text()
    expect(enterOffenceDateCtaLink).toContain('Enter offence date')
  })
})
