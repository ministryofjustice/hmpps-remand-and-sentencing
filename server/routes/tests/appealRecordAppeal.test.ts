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

describe('GET Record appeal', () => {
  it('should render edit and delete links on offence that replaced another', async () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      offences: [
        {
          chargeUuid: '1',
          outcomeUuid: '123',
          offenceCode: 'O111',
          updatedOutcome: true,
          offenceStartDate: new Date(),
        },
        {
          chargeUuid: '2',
          outcomeUuid: '456',
          offenceCode: 'O222',
          updatedOutcome: true,
          offenceStartDate: new Date(),
          sentence: {
            sentenceUuid: '3',
            convictionDate: new Date(),
            sentenceTypeId: '789',
            sentenceServeType: 'FORTHWITH',
            periodLengths: [
              {
                uuid: '4',
                periodLengthType: 'SENTENCE_LENGTH',
                years: '1',
                periodOrder: ['years', 'months', 'weeks', 'days'],
                isAlternative: false,
              },
            ],
          },
        },
      ],
    })
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      O111: 'Offence 1',
      O222: 'Offence 2',
    })
    defaultServices.refDataService.getSentenceTypeMap.mockResolvedValue({
      789: 'SDS',
    })
    defaultServices.refDataService.getChargeOutcomeMap.mockResolvedValue({
      123: {
        outcomeUuid: '123',
        outcomeName: 'Replaced with another',
        displayOrder: 1,
        dispositionCode: 'FINAL',
        nomisCode: '123',
        outcomeType: 'NON_CUSTODIAL',
        status: 'ACTIVE',
      },
      456: {
        outcomeUuid: '456',
        outcomeName: 'Imprisonment',
        displayOrder: 1,
        dispositionCode: 'FINAL',
        nomisCode: '456',
        outcomeType: 'SENTENCING',
        status: 'ACTIVE',
      },
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({})

    const res = await request(app)
      .get('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/record-appeal')
      .expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    expect($('[data-qa="edit-offence-link-1"]').length).toBe(0)
    expect($('[data-qa="delete-offence-link-1"]').length).toBe(0)
    expect($('[data-qa="edit-offence-link-2"]').length).toBe(1)
    expect($('[data-qa="delete-offence-link-2"]').length).toBe(1)
  })
})
