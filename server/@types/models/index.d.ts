declare module 'models' {
  export interface CourtCase {
    uniqueIdentifier?: string
    appearances?: CourtAppearance[]
  } // at some point this needs to change to appearance model

  export interface CourtAppearance {
    caseReferenceNumber?: string
    warrantDate?: Date
    courtName?: string
    nextHearingCourtSelect?: boolean
    nextHearingCourtName?: string
    overallCaseOutcome?: string
    caseOutcomeAppliedAll?: boolean
    nextHearingSelect?: boolean
    nextHearingType?: string
    nextHearingDate?: Date
    nextHearingTimeSet?: boolean
    offences?: Offence[]
    warrantType?: string
    warrantId?: string
    taggedBail?: string
    overallSentenceLength?: SentenceLength
    referenceNumberSelect?: string
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    outcome?: string
    chargeUuid?: string
    sentence?: Sentence
    terrorRelated?: boolean
  }

  export interface Sentence {
    sentenceUuid?: string
    countNumber?: string
    custodialSentenceLength?: SentenceLength
    sentenceServeType?: string
    consecutiveTo?: string
    sentenceType?: string
  }

  export interface SentenceLength {
    years?: string
    months?: string
    weeks?: string
    days?: string
    periodOrder: string[]
  }
}
