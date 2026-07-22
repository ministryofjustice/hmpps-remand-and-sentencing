import { PagedMergedFromCase } from '../remandAndSentencingApi/remandAndSentencingClientTypes'

declare module 'models' {
  export interface CourtCase {
    uniqueIdentifier?: string
    appearances?: CourtAppearance[]
  } // at some point this needs to change to appearance model

  export interface CourtAppearance {
    appearanceUuid: string
    caseReferenceNumber?: string
    noCaseReference?: string
    warrantDate?: Date
    courtCode?: string
    nextAppearanceCourtSelect?: string
    nextAppearanceCourtCode?: string
    appearanceOutcomeUuid?: string
    relatedOffenceOutcomeUuid?: string
    caseOutcomeAppliedAll?: string
    nextAppearanceSelect?: boolean
    nextAppearanceTypeUuid?: string
    nextAppearanceDate?: Date
    nextAppearanceTimeSet?: boolean
    nextAppearanceSubTypeUuid?: string
    offences?: Offence[]
    warrantType?: string
    referenceNumberSelect?: string
    appearanceInformationAccepted?: boolean
    warrantInformationAccepted?: boolean
    offenceSentenceAccepted?: boolean
    aggravatingFactorsAccepted?: boolean
    nextCourtAppearanceAccepted?: boolean
    overallConvictionDate?: Date
    overallConvictionDateAppliedAll?: string
    legacyData?: Record<string, never>
    hasOverallSentenceLength?: string
    uploadedDocuments?: UploadedDocument[]
    documentUploadAccepted?: boolean
    criminalAppealOfficeReference?: string
    hasCommonPlatformDocuments?: boolean
    periodLengths?: SentenceLength[]
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    outcomeUuid?: string
    chargeUuid: string
    sentence?: Sentence
    aggravatingFactors?: AggravatingFactor[]
    legacyData?: Record<string, never>
    updatedOutcome?: boolean
    mergedFromCase?: PagedMergedFromCase
    onFinishGoToEdit?: boolean
    replacesOffenceUuid?: string
    createChargeOrder?: number
    replicatedFromUuid?: string
    offenceDateIsSame?: string
  }

  export interface Sentence {
    sentenceUuid: string
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
    returnUrlKey?: string
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
      | 'BREACH_OF_SUPERVISION_REQUIREMENTS'
      | 'UNSUPPORTED'
    legacyData?: PeriodLengthLegacyData
    description?: string
    uuid: string
    isAlternative: boolean
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

  export interface UploadedDocument {
    documentUUID: UUID
    documentType: string
    fileName: string
    courtDataIngested: boolean
  }

  export interface FileDownload {
    body: Buffer
    header: {
      [key: string]: string
    }
  }

  export interface UrlParameters {
    nomsId: string
    addOrEditCourtCase: string
    courtCaseReference: string
    addOrEditCourtAppearance: string
    appearanceReference: string
    chargeUuid?: string
    documentUuid?: string
    hmctsHearingId?: string
  }
}
