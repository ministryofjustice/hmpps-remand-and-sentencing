declare module 'models' {
  export interface CourtCase {
    uniqueIdentifier?: string
    appearances?: CourtAppearance[]
  } // at some point this needs to change to appearance model

  export interface CourtAppearance {
    appearanceReference?: string
    caseReferenceNumber?: string
    warrantDate?: Date
    courtCode?: string
    nextHearingCourtSelect?: string
    nextHearingCourtCode?: string
    appearanceOutcomeUuid?: string
    relatedOffenceOutcomeUuid?: string
    caseOutcomeAppliedAll?: string
    nextHearingSelect?: boolean
    nextHearingType?: string
    nextHearingDate?: Date
    nextHearingTimeSet?: boolean
    offences?: Offence[]
    warrantType?: string
    warrantId?: string
    taggedBail?: string
    hasTaggedBail?: string
    overallSentenceLength?: SentenceLength
    referenceNumberSelect?: string
    appearanceInformationAccepted?: boolean
    offenceSentenceAccepted?: boolean
    nextCourtAppearanceAccepted?: boolean
    overallConvictionDate?: Date
    overallConvictionDateAppliedAll?: string
    legacyData: Record<string, never>
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    outcomeUuid?: string
    chargeUuid?: string
    sentence?: Sentence
    terrorRelated?: boolean
    legacyData: Record<string, never>
  }

  export interface Sentence {
    sentenceUuid?: string
    countNumber?: string
    periodLengths?: SentenceLength[]
    sentenceServeType?: string
    consecutiveTo?: string
    sentenceTypeId?: string
    sentenceTypeClassification?: string
    convictionDate?: Date
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
  }
  export interface TaskListItem {
    title: { text: string }
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
