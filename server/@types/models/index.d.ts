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
    overallCaseOutcome?: string
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
    sentenceTypeId?: string
    convictionDate?: Date
  }

  export interface SentenceLength {
    years?: string
    months?: string
    weeks?: string
    days?: string
    periodOrder: string[]
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
