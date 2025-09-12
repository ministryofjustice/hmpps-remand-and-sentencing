import type { CourtAppearance } from 'models'
import CalculateReleaseDatesApiClient from '../data/calculateReleaseDatesApiClient'
import CalculateReleaseDatesService from './calculateReleaseDatesService'

jest.mock('../data/calculateReleaseDatesApiClient')

describe('CalculateReleaseDatesService', () => {
  let calculateReleaseDatesApiClient: jest.Mocked<CalculateReleaseDatesApiClient>

  let service: CalculateReleaseDatesService

  beforeEach(() => {
    calculateReleaseDatesApiClient = {
      compareOverallSentenceLength: jest.fn(),
    } as unknown as jest.Mocked<CalculateReleaseDatesApiClient>
    ;(CalculateReleaseDatesApiClient as jest.Mock).mockImplementation(() => calculateReleaseDatesApiClient)

    service = new CalculateReleaseDatesService(calculateReleaseDatesApiClient)
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
  appearanceUuid: '1',
  appearanceInformationAccepted: false,
  offenceSentenceAccepted: false,
  nextCourtAppearanceAccepted: false,
  uploadedDocuments: [],
}

const singleTermLengthSentence: CourtAppearance = {
  ...baseAppearance,
  offences: [
    {
      chargeUuid: '',
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
        sentenceUuid: '0',
        countNumber: '',
        hasCountNumber: '',
        sentenceServeType: '',
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
      chargeUuid: '',
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
        sentenceUuid: '0',
        countNumber: '',
        hasCountNumber: '',
        sentenceServeType: '',
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
      chargeUuid: '',
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
        sentenceUuid: '0',
        countNumber: '',
        hasCountNumber: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
    {
      chargeUuid: '',
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
        sentenceUuid: '1',
        countNumber: '',
        hasCountNumber: '',
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
      chargeUuid: '',
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
        sentenceUuid: '0',
        countNumber: '',
        hasCountNumber: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
    {
      chargeUuid: '',
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
        sentenceUuid: '1',
        countNumber: '',
        hasCountNumber: '',
        sentenceTypeId: '',
        sentenceTypeClassification: '',
        convictionDate: new Date(),
        fineAmount: 0,
        legacyData: {},
      },
    },
  ],
}
