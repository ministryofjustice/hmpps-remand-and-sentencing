import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import { PageCourtCaseContent } from '../../@types/remandAndSentencingApi/remandAndSentencingClientTypes'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET court name', () => {
  it('should render page on new journey', () => {
    const courtAppearance = {
      appearanceUuid: '1',
      appearanceDate: '2025-07-25',
      courtCode: 'ACCRYC',
      warrantType: 'REMAND',
      courtCaseReference: 'A123',
      outcome: {
        outcomeUuid: '1',
        outcomeName: 'Appearance outcome',
      },
      charges: [
        {
          chargeUuid: '1',
          offenceCode: 'OFF123',
          offenceStartDate: '2025-01-01',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
        },
      ],
    }
    const courtCase = {
      courtCaseUuid: '1',
      prisonerId: 'A1234AB',
      status: 'ACTIVE',
      latestAppearance: courtAppearance,
      appearances: [courtAppearance],
    } as PageCourtCaseContent
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
    })
    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })
    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const prisonerBanner = $('.mini-profile').text()
        expect(prisonerBanner).toContain('Meza, Cormac')
        expect(prisonerBanner).toContain('A1234AB')
        expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
        expect(prisonerBanner).toContain('Cell numberCELL-1')
      })
  })
})

describe('Consecutive to label display', () => {
  const baseOffence = {
    chargeUuid: '1',
    offenceCode: 'OFF123',
    offenceStartDate: '2025-01-01',
    offenceEndDate: '2025-01-10',
    outcome: {
      outcomeUuid: '1',
      outcomeName: 'Offence outcome',
    },
    sentence: {
      sentenceServeType: 'CONSECUTIVE',
      consecutiveToSentenceUuid: 'SENT123',
    },
  }

  const setupSharedMocks = ({ offences, consecutiveToSentence }: { offences; consecutiveToSentence }) => {
    const courtAppearance = {
      appearanceUuid: '1',
      appearanceDate: '2025-07-25',
      courtCode: 'ACCRYC',
      warrantType: 'REMAND',
      courtCaseReference: 'A123',
      outcome: {
        outcomeUuid: '1',
        outcomeName: 'Appearance outcome',
      },
      charges: offences,
    }

    const courtCase = {
      courtCaseUuid: '1',
      prisonerId: 'A1234AB',
      status: 'ACTIVE',
      latestAppearance: courtAppearance,
      appearances: [courtAppearance],
    } as PageCourtCaseContent

    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [consecutiveToSentence],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })
  }

  const testCases = [
    {
      title: 'same case with valid count number',
      offences: [
        baseOffence,
        {
          ...baseOffence,
          chargeUuid: '2',
          offenceCode: 'OFF124',
          sentence: {
            sentenceServeType: 'FORTHWITH',
            sentenceUuid: 'SENT123',
          },
        },
      ],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '3',
        courtCode: null,
        appearanceDate: null,
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected: 'Consecutive to count 3',
    },
    {
      title: 'same case with invalid count number',
      offences: [
        baseOffence,
        {
          ...baseOffence,
          chargeUuid: '2',
          offenceCode: 'OFF124',
          sentence: {
            sentenceServeType: 'FORTHWITH',
            sentenceUuid: 'SENT123',
          },
        },
      ],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '-1',
        courtCaseReference: 'A123',
        courtCode: 'ACCRYC',
        appearanceDate: '2025-02-02',
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected: 'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025',
    },
    {
      title: 'different case with valid count number and case ref',
      offences: [baseOffence],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '5',
        courtCaseReference: 'CASE456',
        courtCode: 'ACCRYC',
        appearanceDate: '2025-02-02',
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected: 'Consecutive to count 5 on case CASE456 at Court description on 02/02/2025',
    },
    {
      title: 'different case with valid count number and no case ref',
      offences: [baseOffence],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '6',
        courtCode: 'ACCRYC',
        appearanceDate: '2025-02-02',
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected: 'Consecutive to count 6 at Court description on 02/02/2025',
    },
    {
      title: 'different case with invalid count number and case ref',
      offences: [baseOffence],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '-1',
        courtCaseReference: 'CASE789',
        courtCode: 'ACCRYC',
        appearanceDate: '2025-02-02',
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected:
        'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 on case CASE789 at Court description on 02/02/2025',
    },
    {
      title: 'different case with invalid count number and no case ref',
      offences: [baseOffence],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        countNumber: '-1',
        courtCode: 'ACCRYC',
        appearanceDate: '2025-02-02',
        offenceStartDate: '2025-01-01',
        offenceEndDate: '2025-01-10',
      },
      expected:
        'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 at Court description on 02/02/2025',
    },
    {
      title: 'same case with invalid count number and with no offence-end-date',
      offences: [
        baseOffence,
        {
          ...baseOffence,
          chargeUuid: '2',
          offenceCode: 'OFF124',
          sentence: {
            sentenceServeType: 'FORTHWITH',
            sentenceUuid: 'SENT123',
          },
        },
      ],
      consecutiveTo: {
        sentenceUuid: 'SENT123',
        offenceCode: 'OFF456',
        courtCode: null,
        appearanceDate: null,
        offenceStartDate: '2025-01-01',
      },
      expected: 'Consecutive to OFF456 - Offence description committed on 01/01/2025',
    },
  ]

  testCases.forEach(({ title, offences, consecutiveTo, expected }) => {
    it(`should set consecutive to label correctly when ${title}`, async () => {
      setupSharedMocks({ offences, consecutiveToSentence: consecutiveTo })

      const res = await request(app).get('/person/A1234AB/edit-court-case/1/details').expect('Content-Type', /html/)

      const $ = cheerio.load(res.text)

      const offenceSummaryLists = $('[data-qa="offenceSummaryList"]')
      const lastOffenceSummaryList = offenceSummaryLists.last()
      const consecutiveText = lastOffenceSummaryList
        .find('.govuk-summary-list__row')
        .filter((_, el) => $(el).find('.govuk-summary-list__key').text().trim() === 'Consecutive or concurrent')
        .find('.govuk-summary-list__value')
        .text()
        .trim()

      expect(consecutiveText).toBe(expected)
    })
  })
})
