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

describe('GET Sentence consecutive to', () => {
  it('should render page on new journey', () => {
    defaultServices.courtAppearanceService.getSessionCourtAppearance.mockReturnValue({
      appearanceUuid: '1',
      warrantDate: dayjs({ date: 12, month: 5, year: 2023 }).toDate(),
      offences: [
        {
          chargeUuid: '2',
          offenceCode: 'BB6557',
          sentence: {
            sentenceUuid: '3',
          },
        },
      ],
    })
    defaultServices.offenceService.getSessionOffence.mockReturnValue({
      chargeUuid: '1',
      offenceCode: 'CC12345',
      sentence: {
        sentenceUuid: '2',
      },
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
    defaultServices.remandAndSentencingService.getSentencesToChainTo.mockResolvedValue({
      appearances: [
        {
          courtCode: 'ACCRYC',
          courtCaseReference: 'C123',
          appearanceDate: '2023-03-12',
          sentences: [
            {
              offenceCode: 'CC12345',
              offenceStartDate: '2023-01-12',
              sentenceUuid: '1',
              countNumber: '1',
            },
          ],
        },
        {
          courtCode: 'GHEUTY',
          courtCaseReference: 'G123',
          appearanceDate: '2023-03-12',
          sentences: [
            {
              offenceCode: 'BB6557',
              offenceStartDate: '2023-01-12',
              sentenceUuid: '3',
              countNumber: '1',
            },
          ],
        },
      ],
    })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      CC12345: 'An offence description',
      BB6557: 'Another offence description',
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'A court name',
      GHEUTY: 'Another court name',
    })
    return request(app)
      .get('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/0/sentence-consecutive-to')
      .expect('Content-Type', /html/)
      .expect(res => {
        console.log(res.text)
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
        const continueButton = $('[data-qa=continue-button]').text()
        expect(continueButton).toContain('Continue')
        const radiosContainer = $('.govuk-radios')

        const sameCaseSection = radiosContainer
          .find('> h2[data-qa="sentencesOnSameCaseHeader"]')
          .nextUntil('h2.govuk-heading-m')

        expect(sameCaseSection.find('input[type="radio"][value="3"]').length).toBe(1)

        const otherCasesSection = radiosContainer
          .find('> h2[data-qa="sentencesOnOtherCasesHeader"]')
          .nextUntil('h2.govuk-heading-m')

        expect(otherCasesSection.find('input[type="radio"][value="3"]').length).toBe(0)
      })
  })
})
