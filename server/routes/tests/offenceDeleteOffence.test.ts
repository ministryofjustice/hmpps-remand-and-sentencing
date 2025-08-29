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

describe('GET Delete offence', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          offenceStartDate: new Date(),
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            sentenceReference: '0',
            convictionDate: new Date(),
            countNumber: '1',
            sentenceServeType: 'FORTHWITH',
            sentenceTypeClassification: 'STANDARD',
            sentenceTypeId: '456',
            hasCountNumber: 'true',
            periodLengths: [
              {
                uuid: '4',
                years: '1',
                periodOrder: ['years', 'months', 'weeks', 'days'],
                periodLengthType: 'SENTENCE_LENGTH',
              },
            ],
          },
        },
      ],
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      CC12345: 'An offence description',
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '456',
      classification: 'STANDARD',
      description: 'A sentence type description',
      displayOrder: 10,
    })
    defaultServices.offenceOutcomeService.getOutcomeById.mockResolvedValue({
      outcomeUuid: '123',
      dispositionCode: 'F',
      nomisCode: '10',
      displayOrder: 10,
      outcomeName: 'An offence outcome',
      outcomeType: 'SENTENCING',
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/2/delete-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const deleteButton = $('[data-qa=delete-button]').text()
        expect(deleteButton).toContain('Yes, delete offence')
        expect($('[data-qa=delete-adjustments-inset]').length).toBe(0)
      })
  })

  it('should render page on edit journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantType: 'SENTENCING',
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'CC12345',
          offenceStartDate: new Date(),
          outcomeUuid: '123',
          sentence: {
            sentenceUuid: '3',
            sentenceReference: '0',
            convictionDate: new Date(),
            countNumber: '1',
            sentenceServeType: 'FORTHWITH',
            sentenceTypeClassification: 'STANDARD',
            sentenceTypeId: '456',
            hasCountNumber: 'true',
            periodLengths: [
              {
                uuid: '4',
                years: '1',
                periodOrder: ['years', 'months', 'weeks', 'days'],
                periodLengthType: 'SENTENCE_LENGTH',
              },
            ],
          },
        },
      ],
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      CC12345: 'An offence description',
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})
    defaultServices.remandAndSentencingService.getSentenceTypeById.mockResolvedValue({
      sentenceTypeUuid: '456',
      classification: 'STANDARD',
      description: 'A sentence type description',
      displayOrder: 10,
    })
    defaultServices.offenceOutcomeService.getOutcomeById.mockResolvedValue({
      outcomeUuid: '123',
      dispositionCode: 'F',
      nomisCode: '10',
      displayOrder: 10,
      outcomeName: 'An offence outcome',
      outcomeType: 'SENTENCING',
    })
    return request(app)
      .get('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/offences/2/delete-offence')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const deleteButton = $('[data-qa=delete-button]').text()
        expect(deleteButton).toContain('Yes, delete offence')
        const deleteAdjustmentInset = $('[data-qa=delete-adjustments-inset]').text()
        expect(deleteAdjustmentInset).toContain(
          'Deleting this sentence will also delete Adjustments associated with it',
        )
      })
  })
})
