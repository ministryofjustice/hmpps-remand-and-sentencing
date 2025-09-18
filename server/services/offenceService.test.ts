import type { Offence } from 'models'
import type { OffenceOffenceDateForm } from 'forms'
import { SessionData } from 'express-session'
import dayjs from 'dayjs'
import ManageOffencesService from './manageOffencesService'
import OffenceOutcomeService from './offenceOutcomeService'
import OffenceService from './offenceService'
import RemandAndSentencingService from './remandAndSentencingService'

jest.mock('./manageOffencesService')
jest.mock('./offenceOutcomeService')
jest.mock('./remandAndSentencingService')

describe('offenceService', () => {
  let manageOffencesService: jest.Mocked<ManageOffencesService>
  let offenceOutcomeService: jest.Mocked<OffenceOutcomeService>
  let remandAndSentencingService: jest.Mocked<RemandAndSentencingService>
  let service: OffenceService

  beforeEach(() => {
    manageOffencesService = new ManageOffencesService(null) as jest.Mocked<ManageOffencesService>
    offenceOutcomeService = new OffenceOutcomeService(null) as jest.Mocked<OffenceOutcomeService>
    remandAndSentencingService = new RemandAndSentencingService(null) as jest.Mocked<RemandAndSentencingService>
    service = new OffenceService(manageOffencesService, offenceOutcomeService, remandAndSentencingService)
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
})
