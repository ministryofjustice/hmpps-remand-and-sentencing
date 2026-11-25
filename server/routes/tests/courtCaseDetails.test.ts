import type { Express } from 'express'
import * as cheerio from 'cheerio'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from '../testutils/appSetup'
import config from '../../config'
import { CourtCase as PageCourtCaseContent } from '../../@types/remandAndSentencingApi'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

const createCourtCase = (
  source: string | undefined,
  status: string = 'ACTIVE',
  deleteStatus: 'SUPPORTED' | 'NOT_SUPPORTED' = 'SUPPORTED',
): PageCourtCaseContent => {
  const appearance = {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: 'A123',
    outcome: { outcomeUuid: '1', outcomeName: 'Appearance outcome' },
    charges: [
      {
        chargeUuid: '1',
        offenceCode: 'OFF123',
        offenceStartDate: '2025-01-01',
        outcome: { outcomeUuid: '1', outcomeName: 'Offence outcome' },
      },
    ],
    source,
    deleteStatus,
    periodLengths: [],
  }
  return {
    courtCaseUuid: '1',
    prisonerId: 'A1234AB',
    status,
    latestAppearance: appearance,
    appearances: [appearance],
  } as PageCourtCaseContent
}

const setupDefaultMocks = () => {
  defaultServices.remandAndSentencingService.getConsecutiveToDetails.mockResolvedValue({ sentences: [] })
  defaultServices.manageOffencesService.getOffenceMap.mockResolvedValue({
    OFF123: 'Offence code description',
  })
  defaultServices.courtRegisterService.getCourtMap.mockResolvedValue({
    ACCRYC: 'Court description',
  })
}

describe('GET court case details', () => {
  it('should render page on new journey', async () => {
    const courtCase = createCourtCase('DPS')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    setupDefaultMocks()
    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const prisonerBanner = $('.mini-profile').text()
    expect(prisonerBanner).toContain('Meza, Cormac')
    expect(prisonerBanner).toContain('A1234AB')
    expect(prisonerBanner).toContain('EstablishmentHMP Bedford')
    expect(prisonerBanner).toContain('Cell numberCELL-1')
    const editLink = $('a[href*="load-hearing-details"]')
    expect(editLink.length).toEqual(1)
    const deleteLink = $('a[href*="confirm-delete"]')
    expect(deleteLink.length).toEqual(1)
  })
})

describe('Add missed hearing button', () => {
  const original = config.featureToggles.missedHearing
  afterEach(() => {
    config.featureToggles.missedHearing = original
  })

  it('should show the button linking to the missed hearing journey when the feature toggle is on', async () => {
    config.featureToggles.missedHearing = true
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(createCourtCase('DPS'))
    setupDefaultMocks()
    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details').expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const href = $('[data-qa=add-missed-hearing-button]').attr('href')
    expect(href).toMatch(
      /^\/person\/A1234AB\/edit-court-case\/1\/add-court-appearance\/[0-9a-f-]{36}\/missed-hearing\/new-journey$/,
    )
  })

  it('should hide the button when the feature toggle is off', async () => {
    config.featureToggles.missedHearing = false
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(createCourtCase('DPS'))
    setupDefaultMocks()
    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details').expect('Content-Type', /html/)
    expect(cheerio.load(res.text)('[data-qa=add-missed-hearing-button]').length).toBe(0)
  })
})

const createCourtCaseWithSentence = (status: string, sentenceStatus?: string): PageCourtCaseContent => {
  const appearance = {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'SENTENCING',
    courtCaseReference: 'A123',
    outcome: { outcomeUuid: '1', outcomeName: 'Appearance outcome' },
    charges: [
      {
        chargeUuid: '1',
        offenceCode: 'OFF123',
        offenceStartDate: '2025-01-01',
        outcome: { outcomeUuid: '1', outcomeName: 'Offence outcome' },
        sentence: sentenceStatus ? { sentenceUuid: '1', status: sentenceStatus } : undefined,
      },
    ],
    source: 'DPS',
    deleteStatus: 'SUPPORTED',
    periodLengths: [],
  }
  return {
    courtCaseUuid: '1',
    prisonerId: 'A1234AB',
    status,
    latestAppearance: appearance,
    appearances: [appearance],
  } as PageCourtCaseContent
}

describe('Mark case as active/inactive button', () => {
  it('shows "Mark case as inactive" for an ACTIVE case with no active sentences, linking to the confirm page', async () => {
    const courtCase = createCourtCaseWithSentence('ACTIVE', 'INACTIVE')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    setupDefaultMocks()

    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details')
    const $ = cheerio.load(res.text)
    const button = $('[data-qa="mark-court-case-as-inactive-button"]')
    expect(button.text().trim()).toEqual('Mark case as inactive')
    expect(button.attr('href')).toEqual('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-inactive')
    expect($('[data-qa="mark-court-case-as-active-button"]')).toHaveLength(0)
  })

  it('shows "Mark case as inactive" for an ACTIVE case with an active sentence, linking to the blocking page', async () => {
    const courtCase = createCourtCaseWithSentence('ACTIVE', 'ACTIVE')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    setupDefaultMocks()

    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details')
    const $ = cheerio.load(res.text)
    const button = $('[data-qa="mark-court-case-as-inactive-button"]')
    expect(button.attr('href')).toEqual(
      '/person/A1234AB/edit-court-case/1/cannot-mark-court-case-as-inactive-active-sentences',
    )
  })

  it('shows "Mark case as active" for an INACTIVE case, linking to the confirm page', async () => {
    const courtCase = createCourtCaseWithSentence('INACTIVE', 'INACTIVE')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    setupDefaultMocks()

    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details')
    const $ = cheerio.load(res.text)
    const button = $('[data-qa="mark-court-case-as-active-button"]')
    expect(button.text().trim()).toEqual('Mark case as active')
    expect(button.attr('href')).toEqual('/person/A1234AB/edit-court-case/1/confirm-mark-court-case-as-active')
    expect($('[data-qa="mark-court-case-as-inactive-button"]')).toHaveLength(0)
  })

  it('hides the button for a MERGED case', async () => {
    const courtCase = createCourtCaseWithSentence('MERGED', 'INACTIVE')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    setupDefaultMocks()

    const res = await request(app).get('/person/A1234AB/edit-court-case/1/details')
    const $ = cheerio.load(res.text)
    expect($('[data-qa="mark-court-case-as-inactive-button"]')).toHaveLength(0)
    expect($('[data-qa="mark-court-case-as-active-button"]')).toHaveLength(0)
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
      warrantType: 'NON_SENTENCING',
      courtCaseReference: 'A123',
      outcome: {
        outcomeUuid: '1',
        outcomeName: 'Appearance outcome',
      },
      charges: offences,
      periodLengths: [],
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
      const lastOffenceSummaryList = offenceSummaryLists.first()
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

describe('GET tests for inset text', () => {
  const prisonerId = 'A1234AB'
  const path = `/person/${prisonerId}/edit-court-case/1/details`

  const baseAppearance = {
    appearanceUuid: '1',
    appearanceDate: '2025-07-25',
    courtCode: 'ACCRYC',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: 'A123',
    outcome: { outcomeUuid: '1', outcomeName: 'Appearance outcome' },
    charges: [
      {
        chargeUuid: '1',
        offenceCode: 'OFF123',
        offenceStartDate: '2025-01-01',
        outcome: { outcomeUuid: '1', outcomeName: 'Offence outcome' },
      },
    ],
    periodLengths: [],
  }

  const baseCourtCase: PageCourtCaseContent = {
    courtCaseUuid: '1',
    prisonerId,
    status: 'ACTIVE',
    latestAppearance: baseAppearance,
    appearances: [baseAppearance],
    mergedToCaseDetails: {
      mergedToDate: '2024-08-12',
      caseReference: 'T20107142',
      courtCode: 'ACCRYC',
      warrantDate: '2024-07-25',
    },
  } as PageCourtCaseContent

  beforeEach(() => {
    setupDefaultMocks()
  })

  const expectInsetText = async (courtCase: PageCourtCaseContent, expected: string) => {
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    const res = await request(app).get(path).expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const insetText = $('[data-qa="mergedToInsetText"]').text().trim()
    expect(insetText).toEqual(expected)
  }

  it('should show inset with case reference when parent has a case reference', async () => {
    const courtCase: PageCourtCaseContent = {
      ...baseCourtCase,
      mergedToCaseDetails: {
        ...baseCourtCase.mergedToCaseDetails!,
        caseReference: 'T20107142',
      },
    }
    await expectInsetText(
      courtCase,
      'Offences from this court case were merged on 12/08/2024 with T20107142 at Court description',
    )
  })

  it('should show inset without case reference when parent has no case reference', async () => {
    const courtCase: PageCourtCaseContent = {
      ...baseCourtCase,
      mergedToCaseDetails: {
        ...baseCourtCase.mergedToCaseDetails!,
        caseReference: null,
      },
    }
    await expectInsetText(
      courtCase,
      'Offences from this court case were merged on 12/08/2024 with the case at Court description on 25/07/2024',
    )
  })
})

describe('GET tests for NOMIS tag', () => {
  const prisonerId = 'A1234AB'
  const path = `/person/${prisonerId}/edit-court-case/1/details`

  beforeEach(() => {
    setupDefaultMocks()
  })

  it('should display the NOMIS tag when appearance source is NOMIS', async () => {
    const courtCase = createCourtCase('NOMIS')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    const res = await request(app).get(path).expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const nomisTag = $('.govuk-tag').text().trim()
    expect(nomisTag).toEqual('From NOMIS')
  })

  it('should not display the NOMIS tag when appearance source is not NOMIS', async () => {
    const courtCase = createCourtCase('DPS')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    const res = await request(app).get(path).expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    // Expect no tag with the specific text to be present
    const nomisTag = $('.govuk-tag').filter((i, el) => $(el).text().trim() === 'From NOMIS')
    expect(nomisTag.length).toBe(0)
  })

  it('should not display the NOMIS tag when appearance source is undefined', async () => {
    const courtCase = createCourtCase(undefined)
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    const res = await request(app).get(path).expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    // Expect no tag with the specific text to be present
    const nomisTag = $('.govuk-tag').filter((i, el) => $(el).text().trim() === 'From NOMIS')
    expect(nomisTag.length).toBe(0)
  })

  it('should not display links when case status is MERGED', async () => {
    const courtCase = createCourtCase('NOMIS', 'MERGED', 'NOT_SUPPORTED')
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)

    const res = await request(app).get(path).expect('Content-Type', /html/)
    const $ = cheerio.load(res.text)
    const editLinks = $('a:contains("Edit")')
    expect(editLinks.length).toBe(0)
    const deleteLinks = $('a:contains("Delete")')
    expect(deleteLinks.length).toBe(0)
  })
})

describe('Delete restriction messages', () => {
  const path = '/person/A1234AB/edit-court-case/1/details'
  const mergedToMessage =
    'You cannot delete this hearing because this court case has been merged with another court case.'
  const mergedFromMessage =
    'You cannot delete this hearing because another court case has been merged with this court case.'
  const sentencesMessage = 'You cannot delete a hearing that includes sentences.'

  const withChargeFields = (courtCase: PageCourtCaseContent, chargeFields: object): PageCourtCaseContent => {
    const originalAppearance = courtCase.appearances[0]
    const originalCharge = originalAppearance.charges[0]

    const updatedCharge = { ...originalCharge, ...chargeFields }
    const updatedAppearance = { ...originalAppearance, charges: [updatedCharge] }

    return {
      ...courtCase,
      latestAppearance: updatedAppearance,
      appearances: [updatedAppearance],
    } as PageCourtCaseContent
  }

  const getMessages = async (courtCase: PageCourtCaseContent) => {
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue(courtCase)
    setupDefaultMocks()
    const res = await request(app).get(path)
    const $ = cheerio.load(res.text)
    return {
      messages: $('[data-qa="deleteRestrictionText"]')
        .map((_, el) => $(el).text().trim())
        .get(),
      deleteLinks: $('a:contains("Delete")').length,
    }
  }

  it('should show the merged to message for a merged (child) case', async () => {
    const { messages, deleteLinks } = await getMessages(createCourtCase('DPS', 'MERGED', 'NOT_SUPPORTED'))
    expect(messages).toEqual([mergedToMessage])
    expect(deleteLinks).toBe(0)
  })

  it('should show the merged from message for a case with merged cases (parent)', async () => {
    const courtCase = withChargeFields(createCourtCase('DPS', 'ACTIVE', 'NOT_SUPPORTED'), {
      mergedFromCase: { caseReference: 'T123', courtCode: 'ACCRYC', mergedFromDate: '2024-08-12' },
    })
    const { messages, deleteLinks } = await getMessages(courtCase)
    expect(messages).toEqual([mergedFromMessage])
    expect(deleteLinks).toBe(0)
  })

  it('should keep the sentences message for a hearing with sentences', async () => {
    const courtCase = withChargeFields(createCourtCase('DPS', 'ACTIVE', 'NOT_SUPPORTED'), {
      sentence: { sentenceUuid: '1' },
    })
    const { messages } = await getMessages(courtCase)
    expect(messages).toEqual([sentencesMessage])
  })

  it('should not show both messages when merged and sentenced', async () => {
    const courtCase = withChargeFields(createCourtCase('DPS', 'MERGED', 'NOT_SUPPORTED'), {
      sentence: { sentenceUuid: '1' },
    })
    const { messages } = await getMessages(courtCase)
    expect(messages).toEqual([mergedToMessage])
  })

  it('should show no message when the hearing can be deleted', async () => {
    const { messages, deleteLinks } = await getMessages(createCourtCase('DPS', 'ACTIVE', 'SUPPORTED'))
    expect(messages).toEqual([])
    expect(deleteLinks).toBe(1)
  })
})

describe.each([
  ['non-sentencing', 'NON_SENTENCING'],
  ['appeal', 'APPEAL'],
  ['breach', 'BREACH_OF_SUPERVISION_REQUIREMENTS'],
  ['sentencing', 'SENTENCING'],
])('Hearing action links for a %s hearing with a recalled sentence', (_, warrantType) => {
  const path = '/person/A1234AB/edit-court-case/1/details'

  it('should show the Edit link and hide the Delete link', async () => {
    const courtCase = createCourtCase('DPS')
    const appearance = {
      ...courtCase.appearances[0],
      warrantType,
      charges: [{ ...courtCase.appearances[0].charges[0], sentence: { sentenceUuid: '1', hasRecall: true } }],
    }
    defaultServices.remandAndSentencingService.getCourtCaseDetails.mockResolvedValue({
      ...courtCase,
      latestAppearance: appearance,
      appearances: [appearance],
    } as PageCourtCaseContent)
    setupDefaultMocks()

    const res = await request(app).get(path)
    const $ = cheerio.load(res.text)
    const actions = $('[data-qa="hearingActionList-1"]')
    expect(actions.find('a:contains("Edit")')).toHaveLength(1)
    expect(actions.find('a:contains("Delete")')).toHaveLength(0)
  })
})
