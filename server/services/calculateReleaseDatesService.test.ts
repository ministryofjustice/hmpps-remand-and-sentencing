import type { CourtAppearance } from 'models'
import CalculateReleaseDatesApiClient from '../api/calculateReleaseDatesApiClient'
import CalculateReleaseDatesService from './calculateReleaseDatesService'
import { HmppsAuthClient } from '../data'

jest.mock('../api/calculateReleaseDatesApiClient')
jest.mock('../data/hmppsAuthClient')

describe('CalculateReleaseDatesService', () => {
  let calculateReleaseDatesApiClient: jest.Mocked<CalculateReleaseDatesApiClient>
  let hmppsAuthClient: jest.Mocked<HmppsAuthClient>
  let service: CalculateReleaseDatesService

  beforeEach(() => {
    hmppsAuthClient = {
      getSystemClientToken: jest.fn().mockResolvedValue(token),
    } as unknown as jest.Mocked<HmppsAuthClient>

    calculateReleaseDatesApiClient = {
      compareOverallSentenceLength: jest.fn(),
    } as unknown as jest.Mocked<CalculateReleaseDatesApiClient>
    ;(CalculateReleaseDatesApiClient as jest.Mock).mockImplementation(() => calculateReleaseDatesApiClient)

    service = new CalculateReleaseDatesService(hmppsAuthClient)
  })

  describe('compareOverallSentenceLength', () => {
    it('should fail validation when no sentences exist and there is an overall sentence length', async () => {
      const result = await service.compareOverallSentenceLength(baseAppearance, 'user')
      expect(result.custodialLengthMatches).toBe(false)
    })

    it('should pass validation when hasOverallSentenceLength is not true', async () => {
      const result = await service.compareOverallSentenceLength(
        {
          ...baseAppearance,
          hasOverallSentenceLength: 'false',
        },
        'user',
      )
      expect(result.custodialLengthMatches).toBe(true)
    })

    it('should perform single sentence validation locally and not call the CRD api - fails validation', async () => {
      const result = await service.compareOverallSentenceLength(singleTermLengthSentence, 'user')
      expect(result.custodialLengthMatches).toBe(false)
      expect(calculateReleaseDatesApiClient.compareOverallSentenceLength).not.toHaveBeenCalled()
    })

    it('should perform single sentence validation locally and not call the CRD api - passes validation', async () => {
      const result = await service.compareOverallSentenceLength(singleSentenceLengthSentence, 'user')
      expect(result.custodialLengthMatches).toBe(true)
      expect(calculateReleaseDatesApiClient.compareOverallSentenceLength).not.toHaveBeenCalled()
    })

    it('should call API for multiple supported sentences - passes validation', async () => {
      calculateReleaseDatesApiClient.compareOverallSentenceLength.mockResolvedValue({
        custodialLengthMatches: true,
        custodialLength: { years: 2, months: 6, weeks: 0, days: 0 },
        licenseLengthMatches: false,
        licenseLength: undefined,
      })

      const result = await service.compareOverallSentenceLength(multipleSupportedSentences, 'test-user')
      expect(hmppsAuthClient.getSystemClientToken).toHaveBeenCalledWith('test-user')
      expect(calculateReleaseDatesApiClient.compareOverallSentenceLength).toHaveBeenCalled()
      expect(result.custodialLengthMatches).toBe(true)
    })

    it('should not call API for multiple sentences if any are unsupported - passes validation', async () => {
      const result = await service.compareOverallSentenceLength(multipleSentencesAndUnsupported, 'test-user')
      expect(calculateReleaseDatesApiClient.compareOverallSentenceLength).not.toHaveBeenCalled()
      expect(result.custodialLengthMatches).toBe(true)
    })
  })
})

const token = 'some-token'

const baseAppearance: CourtAppearance = {
  hasOverallSentenceLength: 'true',
  warrantDate: new Date('2023-01-01'),
  offences: [],
  overallSentenceLength: {
    years: '2',
    months: '6',
    weeks: '0',
    days: '0',
    periodLengthType: 'OVERALL_SENTENCE_LENGTH',
    periodOrder: [],
    description: '',
    uuid: '',
  },
  appearanceReference: '',
  appearanceInformationAccepted: false,
  offenceSentenceAccepted: false,
  nextCourtAppearanceAccepted: false,
}

const singleTermLengthSentence: CourtAppearance = {
  ...baseAppearance,
  offences: [
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'TERM_LENGTH',
            years: '1',
            months: '0',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        sentenceServeType: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
  ],
}

const singleSentenceLengthSentence: CourtAppearance = {
  ...baseAppearance,
  offences: [
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'SENTENCE_LENGTH',
            years: '2',
            months: '6',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        sentenceServeType: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
  ],
}

const multipleSupportedSentences: CourtAppearance = {
  ...baseAppearance,
  offences: [
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'SENTENCE_LENGTH',
            years: '1',
            months: '0',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceServeType: 'CONCURRENT',
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'SENTENCE_LENGTH',
            years: '1',
            months: '6',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceServeType: 'CONCURRENT',
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
  ],
}

const multipleSentencesAndUnsupported: CourtAppearance = {
  ...baseAppearance,
  offences: [
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'TERM_LENGTH',
            years: '1',
            months: '0',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceServeType: 'CONCURRENT',
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
    {
      sentence: {
        periodLengths: [
          {
            periodLengthType: 'SENTENCE_LENGTH',
            years: '1',
            months: '6',
            weeks: '0',
            days: '0',
            periodOrder: [],
            description: '',
            uuid: '',
          },
        ],
        sentenceServeType: 'CONCURRENT',
        sentenceUuid: '',
        countNumber: '',
        hasCountNumber: '',
        consecutiveTo: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
  ],
}
