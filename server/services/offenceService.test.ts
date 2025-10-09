import type { Offence } from 'models'
import type {
  CorrectAlternativeManyPeriodLengthsForm,
  CorrectManyPeriodLengthsForm,
  OffenceOffenceDateForm,
} from 'forms'
import { SessionData } from 'express-session'
import dayjs from 'dayjs'
import ManageOffencesService from './manageOffencesService'
import OffenceService from './offenceService'
import RemandAndSentencingService from './remandAndSentencingService'
import RefDataService from './refDataService'

jest.mock('./manageOffencesService')
jest.mock('./refDataService')
jest.mock('./remandAndSentencingService')

describe('offenceService', () => {
  let manageOffencesService: jest.Mocked<ManageOffencesService>
  let refDataService: jest.Mocked<RefDataService>
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let service: OffenceService

  beforeEach(() => {
    manageOffencesService = new ManageOffencesService(null) as jest.Mocked<ManageOffencesService>
    refDataService = new RefDataService(null) as jest.Mocked<RefDataService>
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    service = new OffenceService(manageOffencesService, remandAndSentencingService, refDataService)
  })

  it('must clear offence end date', () => {
    const nomsId = 'P123'
    const courtCaseReference = '1'
    const offence = {
      chargeUuid: '1',
      offenceStartDate: new Date(),
      offenceEndDate: new Date(),
    } as Offence
    const session = {
      offences: {
        [`${nomsId}-${courtCaseReference}`]: offence,
      },
    } as unknown as Partial<SessionData>
    const offenceOffenceDateForm = {
      'offenceStartDate-day': '12',
      'offenceStartDate-month': '5',
      'offenceStartDate-year': '2025',
    } as OffenceOffenceDateForm
    const errors = service.setOffenceDates(
      session,
      nomsId,
      courtCaseReference,
      offenceOffenceDateForm,
      dayjs().add(10, 'days').toDate(),
      dayjs().add(10, 'days').toDate(),
    )
    expect(errors.length).toBe(0)
    expect(offence.offenceEndDate).toBeUndefined()
  })

  describe('validateOffenceMandatoryFields', () => {
    it('no errors for if no sentence on offence', () => {
      const offence = {} as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors.length).toBe(0)
    })

    it('the correct errors are returned if no sentence type and no sentence length', () => {
      const offence = { sentence: {} } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([
        {
          href: '#',
          text: 'You must enter the sentence type',
        },
      ])
    })

    it('the correct errors are returned if there is a sentence type of STANDARD and no sentence lengths', () => {
      const offence = {
        sentence: {
          sentenceServeType: 'CONSECUTIVE',
          consecutiveToSentenceUuid: 'uuid1',
          sentenceTypeClassification: 'STANDARD',
          periodLengths: [],
        },
      } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([
        {
          href: '#',
          text: 'You must enter the sentence length',
        },
      ])
    })

    it('no errors are returned if there is an unknown sentence type (legacy) and no sentence lengths', () => {
      const offence = {
        sentence: {
          sentenceServeType: 'CONSECUTIVE',
          consecutiveToSentenceUuid: 'uuid1',
          sentenceTypeClassification: 'LEGACY_UNKNOWN',
          periodLengths: [],
        },
      } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([])
    })

    it('the correct errors are returned if there is a sentence type of SOPC and no sentence lengths', () => {
      const offence = {
        sentence: {
          sentenceServeType: 'CONSECUTIVE',
          consecutiveToSentenceUuid: 'uuid1',
          sentenceTypeClassification: 'SOPC',
          periodLengths: [],
        },
      } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([
        {
          href: '#',
          text: 'You must enter the sentence length',
        },
        {
          href: '#',
          text: 'You must enter the licence period',
        },
      ])
    })

    it('correct errors returned if sentence type is CONSECUTIVE but sentence-consec-to is not set', () => {
      const offence = {
        sentence: {
          sentenceServeType: 'CONSECUTIVE',
          sentenceTypeClassification: 'UNKNOWN',
          periodLengths: [{ periodLengthType: 'SENTENCE_LENGTH' }],
        },
      } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([
        {
          href: '#',
          text: 'You must enter consecutive to details',
        },
      ])
    })

    it('no errors returned if all sentence mandatory details populated', () => {
      const offence = {
        sentence: {
          sentenceServeType: 'CONSECUTIVE',
          sentenceTypeClassification: 'UNKNOWN',
          consecutiveToSentenceUuid: 'uuid1',
          periodLengths: [{ periodLengthType: 'SENTENCE_LENGTH' }],
        },
      } as Offence
      const errors = service.validateOffenceMandatoryFields(offence)
      expect(errors).toEqual([])
    })
  })

  describe('correctManyPeriodLengths', () => {
    it('clear all other period length types and keep uuid', () => {
      const nomsId = 'P123'
      const courtCaseReference = '1'
      const offence = {
        chargeUuid: '1',
        sentence: {
          sentenceUuid: '2',
          periodLengths: [
            {
              uuid: '5',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
            {
              uuid: '6',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
            {
              uuid: '7',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
          ],
        },
      } as Offence
      const session = {
        offences: {
          [`${nomsId}-${courtCaseReference}`]: offence,
        },
      } as unknown as Partial<SessionData>
      const correctManyPeriodLengthsForm = {
        correctPeriodLengthUuid: '6',
      } as CorrectManyPeriodLengthsForm
      const errors = service.correctManyPeriodLengths(
        session,
        nomsId,
        courtCaseReference,
        correctManyPeriodLengthsForm,
        'SENTENCE_LENGTH',
        undefined,
      )
      expect(errors.length).toBe(0)
      expect(offence.sentence.periodLengths.length).toBe(1)
      const periodLength = offence.sentence.periodLengths[0]
      expect(periodLength.uuid).toBe(correctManyPeriodLengthsForm.correctPeriodLengthUuid)
    })

    it('clear only legacy code period length types keeping other legacy code', () => {
      const nomsId = 'P123'
      const courtCaseReference = '1'
      const offence = {
        chargeUuid: '1',
        sentence: {
          sentenceUuid: '2',
          periodLengths: [
            {
              uuid: '5',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'UNSUPPORTED',
              legacyData: {
                sentenceTermCode: 'UNSUPPORTED123',
              },
            },
            {
              uuid: '6',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'UNSUPPORTED',
              legacyData: {
                sentenceTermCode: 'UNSUPPORTED123',
              },
            },
            {
              uuid: '7',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'UNSUPPORTED',
              legacyData: {
                sentenceTermCode: 'UNSUPPORTED999',
              },
            },
          ],
        },
      } as Offence
      const session = {
        offences: {
          [`${nomsId}-${courtCaseReference}`]: offence,
        },
      } as unknown as Partial<SessionData>
      const correctManyPeriodLengthsForm = {
        correctPeriodLengthUuid: '6',
      } as CorrectManyPeriodLengthsForm
      const errors = service.correctManyPeriodLengths(
        session,
        nomsId,
        courtCaseReference,
        correctManyPeriodLengthsForm,
        'UNSUPPORTED',
        'UNSUPPORTED123',
      )
      expect(errors.length).toBe(0)
      expect(offence.sentence.periodLengths.length).toBe(2)
      expect(offence.sentence.periodLengths.map(periodLength => periodLength.uuid).sort()).toEqual(['6', '7'])
    })

    it('clear all types and replace with new period length', () => {
      const nomsId = 'P123'
      const courtCaseReference = '1'
      const offence = {
        chargeUuid: '1',
        sentence: {
          sentenceUuid: '2',
          periodLengths: [
            {
              uuid: '5',
              years: '5',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
            {
              uuid: '6',
              years: '6',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
            {
              uuid: '7',
              years: '7',
              periodOrder: ['years', 'months', 'weeks', 'days'],
              periodLengthType: 'SENTENCE_LENGTH',
            },
          ],
        },
      } as Offence
      const session = {
        offences: {
          [`${nomsId}-${courtCaseReference}`]: offence,
        },
      } as unknown as Partial<SessionData>
      const correctManyPeriodLengthsForm = {
        correctPeriodLengthUuid: 'NONE',
        'sentenceLength-years': '1',
      } as CorrectManyPeriodLengthsForm
      const errors = service.correctManyPeriodLengths(
        session,
        nomsId,
        courtCaseReference,
        correctManyPeriodLengthsForm,
        'SENTENCE_LENGTH',
        undefined,
      )
      expect(errors.length).toBe(0)
      expect(offence.sentence.periodLengths.length).toBe(1)
      const periodLength = offence.sentence.periodLengths[0]
      expect(periodLength.years).toBe(correctManyPeriodLengthsForm['sentenceLength-years'])
    })
  })

  it('clear all types and replace with new alternative period length', () => {
    const nomsId = 'P123'
    const courtCaseReference = '1'
    const offence = {
      chargeUuid: '1',
      sentence: {
        sentenceUuid: '2',
        periodLengths: [
          {
            uuid: '5',
            years: '5',
            periodOrder: ['years', 'months', 'weeks', 'days'],
            periodLengthType: 'SENTENCE_LENGTH',
          },
          {
            uuid: '6',
            years: '6',
            periodOrder: ['years', 'months', 'weeks', 'days'],
            periodLengthType: 'SENTENCE_LENGTH',
          },
          {
            uuid: '7',
            years: '7',
            periodOrder: ['years', 'months', 'weeks', 'days'],
            periodLengthType: 'SENTENCE_LENGTH',
          },
        ],
      },
    } as Offence
    const session = {
      offences: {
        [`${nomsId}-${courtCaseReference}`]: offence,
      },
    } as unknown as Partial<SessionData>
    const correctManyAlterantivePeriodLengthsForm = {
      'firstSentenceLength-value': '5',
      'firstSentenceLength-period': 'months',
      'secondSentenceLength-value': '2',
      'secondSentenceLength-period': 'years',
    } as CorrectAlternativeManyPeriodLengthsForm

    const errors = service.correctManyAlternativePeriodLength(
      session,
      nomsId,
      courtCaseReference,
      correctManyAlterantivePeriodLengthsForm,
      'SENTENCE_LENGTH',
      undefined,
    )
    expect(errors.length).toBe(0)
    expect(offence.sentence.periodLengths.length).toBe(1)
    const periodLength = offence.sentence.periodLengths[0]
    expect(periodLength.years).toBe(correctManyAlterantivePeriodLengthsForm['secondSentenceLength-value'])
  })
})
