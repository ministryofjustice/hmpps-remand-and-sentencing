import type { SentenceLength } from 'models'

export interface GroupedPeriodLengths {
  key: string
  type:
    | 'SENTENCE_LENGTH'
    | 'CUSTODIAL_TERM'
    | 'LICENCE_PERIOD'
    | 'TARIFF_LENGTH'
    | 'TERM_LENGTH'
    | 'OVERALL_SENTENCE_LENGTH'
    | 'UNSUPPORTED'
  legacyCode?: string
  lengths: SentenceLength[]
}
