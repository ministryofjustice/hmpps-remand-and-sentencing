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
  const baseCourtAppearance = {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'REMAND',
    courtCaseReference: 'A123',
    outcome: {
      outcomeUuid: '1',
      outcomeName: 'Appearance outcome',
    },
  }

  const offence = {
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

  const baseCourtCase = {
    courtCaseUuid: '1',
    prisonerId: 'A1234AB',
    status: 'ACTIVE',
  }

  const appearanceDate = '2025-02-02'

  const sharedSetup = ({ countNumber, caseRef }: { countNumber: string | null; caseRef?: string }) => {
    const courtAppearance = {
      ...baseCourtAppearance,
      charges: [{ ...offence }],
    }

    const courtCase = {
      ...baseCourtCase,
      latestAppearance: courtAppearance,
      appearances: [courtAppearance],
    } as PageCourtCaseContent

    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: countNumber ?? undefined,
          courtCaseReference: caseRef,
          courtCode: 'ACCRYC',
          appearanceDate,
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
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
      title: 'different case with valid count number and case ref',
      input: { countNumber: '5', caseRef: 'CASE456' },
      expected: 'Consecutive to count 5 on case CASE456 at Court description on 02/02/2025',
    },
    {
      title: 'different case with valid count number and no case ref',
      input: { countNumber: '6' },
      expected: 'Consecutive to count 6 at Court description on 02/02/2025',
    },
    {
      title: 'different case with invalid count number and case ref',
      input: { countNumber: '-1', caseRef: 'CASE789' },
      expected:
        'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 on case CASE789 at Court description on 02/02/2025',
    },
    {
      title: 'different case with invalid count number and no case ref',
      input: { countNumber: '-1' },
      expected:
        'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 at Court description on 02/02/2025',
    },
  ]

  testCases.forEach(({ title, input, expected }) => {
    it(`should set consecutive to label correctly when ${title}`, () => {
      sharedSetup(input)

      return request(app)
        .get('/person/A1234AB/edit-court-case/1/details')
        .expect('Content-Type', /html/)
        .expect(res => {
          const $ = cheerio.load(res.text)
          const consecutiveText = $(
            '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
          )
            .text()
            .trim()
          expect(consecutiveText).toBe(expected)
        })
    })
  })
})

describe.skip('XXXX Consecutive to label display', () => {
  it('should set consecutive to label correctly when same case with valid count number', () => {
    const courtAppearance = {
      appearanceUuid: '1',
      // appearanceDate: '2025-07-25',
      // courtCode: 'ACCRYC',
      warrantType: 'REMAND',
      // courtCaseReference: 'A123',
      outcome: {
        outcomeUuid: '1',
        outcomeName: 'Appearance outcome',
      },
      charges: [
        {
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '3',
          courtCaseReference: null,
          courtCode: null,
          appearanceDate: null,
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe('Consecutive to count 3')
      })
  })

  it('should set consecutive to label correctly when same case with invalid count number', () => {
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
          offenceEndDate: '2025-01-10',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
          sentence: {
            sentenceServeType: 'CONSECUTIVE',
            consecutiveToSentenceUuid: 'SENT123',
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '-1',
          courtCaseReference: 'A123',
          courtCode: 'ACCRYC',
          appearanceDate: '2025-02-02',
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe(
          'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025',
        )
      })
  })

  it('should set consecutive to label correctly when different case with valid count number and case ref', () => {
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
          offenceEndDate: '2025-01-10',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
          sentence: {
            sentenceServeType: 'CONSECUTIVE',
            consecutiveToSentenceUuid: 'SENT123',
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '5',
          courtCaseReference: 'CASE456',
          courtCode: 'ACCRYC',
          appearanceDate: '2025-02-02',
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe('Consecutive to count 5 on case CASE456 at Court description on 02/02/2025')
      })
  })

  it('should set consecutive to label correctly when different case with valid count number and no case ref', () => {
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
          offenceEndDate: '2025-01-10',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
          sentence: {
            sentenceServeType: 'CONSECUTIVE',
            consecutiveToSentenceUuid: 'SENT123',
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '6',
          courtCode: 'ACCRYC',
          appearanceDate: '2025-02-02',
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe('Consecutive to count 6 at Court description on 02/02/2025')
      })
  })

  it('should set consecutive to label correctly when different case with invalid count number and case ref', () => {
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
          offenceEndDate: '2025-01-10',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
          sentence: {
            sentenceServeType: 'CONSECUTIVE',
            consecutiveToSentenceUuid: 'SENT123',
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '-1',
          courtCaseReference: 'CASE789',
          courtCode: 'ACCRYC',
          appearanceDate: '2025-02-02',
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe(
          'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 on case CASE789 at Court description on 02/02/2025',
        )
      })
  })

  it('should set consecutive to label correctly when different case with invalid count number and no case ref', () => {
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
          offenceEndDate: '2025-01-10',
          outcome: {
            outcomeUuid: '1',
            outcomeName: 'Offence outcome',
          },
          sentence: {
            sentenceServeType: 'CONSECUTIVE',
            consecutiveToSentenceUuid: 'SENT123',
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

    defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({
      sentences: [
        {
          sentenceUuid: 'SENT123',
          offenceCode: 'OFF456',
          countNumber: '-1',
          courtCode: 'ACCRYC',
          appearanceDate: '2025-02-02',
          offenceStartDate: '2025-01-01',
          offenceEndDate: '2025-01-10',
        },
      ],
    })

    defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
      OFF123: 'Offence code description',
      OFF456: 'Offence description',
    })

    defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
      ACCRYC: 'Court description',
    })

    return request(app)
      .get('/person/A1234AB/edit-court-case/1/details')
      .expect('Content-Type', /html/)
      .expect(res => {
        const $ = cheerio.load(res.text)
        const consecutiveText = $(
          '[data-qa="offenceSummaryList"] .govuk-summary-list__row:nth-child(3) .govuk-summary-list__value',
        )
          .text()
          .trim()
        expect(consecutiveText).toBe(
          'Consecutive to OFF456 - Offence description committed on 01/01/2025 to 10/01/2025 at Court description on 02/02/2025',
        )
      })
  })
})
