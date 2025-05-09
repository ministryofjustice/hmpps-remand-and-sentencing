declare module 'models' {
  export interface CourtCase {
    uniqueIdentifier?: string
    existingDraft?: boolean
    appearances?: CourtAppearance[]
  } // at some point this needs to change to appearance model

  export interface CourtAppearance {
    appearanceReference?: string
    caseReferenceNumber?: string
    noCaseReference?: string
    warrantDate?: Date
    courtCode?: string
    nextHearingCourtSelect?: string
    nextHearingCourtCode?: string
    appearanceOutcomeUuid?: string
    relatedOffenceOutcomeUuid?: string
    caseOutcomeAppliedAll?: string
    nextHearingSelect?: boolean
    nextHearingTypeUuid?: string
    nextHearingDate?: Date
    nextHearingTimeSet?: boolean
    offences?: Offence[]
    warrantType?: string
    warrantId?: string
    overallSentenceLength?: SentenceLength
    referenceNumberSelect?: string
    appearanceInformationAccepted?: boolean
    warrantInformationAccepted?: boolean
    offenceSentenceAccepted?: boolean
    nextCourtAppearanceAccepted?: boolean
    overallConvictionDate?: Date
    overallConvictionDateAppliedAll?: string
    legacyData?: Record<string, never>
    hasOverallSentenceLength?: string
    existingDraft?: boolean
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    outcomeUuid?: string
    chargeUuid?: string
    sentence?: Sentence
    terrorRelated?: boolean
    legacyData?: Record<string, never>
    updatedOutcome?: boolean
  }

  export interface Sentence {
    sentenceUuid?: string
    countNumber?: string
    hasCountNumber?: string
    periodLengths?: SentenceLength[]
    sentenceServeType?: string
    sentenceTypeId?: string
    sentenceTypeClassification?: string
    convictionDate?: Date
    fineAmount?: number
    legacyData?: SentenceLegacyData
    isSentenceConsecutiveToAnotherCase?: string
    consecutiveToSentenceUuid?: string
    sentenceReference: string
    consecutiveToSentenceReference?: string
  }

  export interface SentenceLength {
    years?: string
    months?: string
    weeks?: string
    days?: string
    periodOrder: string[]
    periodLengthType:
      | 'SENTENCE_LENGTH'
      | 'CUSTODIAL_TERM'
      | 'LICENCE_PERIOD'
      | 'TARIFF_LENGTH'
      | 'TERM_LENGTH'
      | 'OVERALL_SENTENCE_LENGTH'
    legacyData?: PeriodLengthLegacyData
    description?: string
    uuid?: string
  }
  export interface TaskListItem {
    title: { text: string; classes?: string }
    href: string
    status: TaskListItemStatus
  }

  export interface TaskListItemStatus {
    text?: string
    classes?: string
    tag?: {
      text: string
      classes?: string
    }
  }
}
