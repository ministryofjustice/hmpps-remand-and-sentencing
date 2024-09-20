const sentenceTypePeriodLengths = {
  STANDARD: {
    periodLengths: [
      {
        type: 'SENTENCE_LENGTH',
      },
    ],
  },
  EXTENDED: {
    periodLengths: [
      {
        type: 'OVERALL_SENTENCE_LENGTH',
      },
      {
        type: 'CUSTODIAL_TERM',
      },
      {
        type: 'LICENCE_PERIOD',
      },
    ],
  },
  SOPC: {
    periodLengths: [
      {
        type: 'SENTENCE_LENGTH',
      },
      {
        type: 'LICENCE_PERIOD',
        auto: true,
        periodLength: {
          years: '1',
          periodOrder: ['years'],
          periodLengthType: 'LICENCE_PERIOD',
        },
      },
    ],
  },
  INDETERMINATE: {
    periodLengths: [
      {
        type: 'TARIFF_LENGTH',
      },
    ],
  },
  BOTUS: {
    periodLengths: [
      {
        type: 'TERM_LENGTH',
      },
    ],
  },
  CIVIL: {
    periodLengths: [
      {
        type: 'TERM_LENGTH',
      },
    ],
  },
  DTO: {
    periodLengths: [
      {
        type: 'TERM_LENGTH',
      },
    ],
  },
  FINE: {
    periodLengths: [
      {
        type: 'TERM_LENGTH',
      },
    ],
  },
  LEGACY: {
    periodLengths: [],
  },
  NON_CUSTODIAL: {
    periodLengths: [],
  },
}

export default sentenceTypePeriodLengths