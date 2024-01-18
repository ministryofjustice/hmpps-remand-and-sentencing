declare module 'forms' {
  export interface CourtCaseReferenceForm {
    referenceNumber?: string
  }

  export interface CourtCaseSelectReferenceForm {
    referenceNumberSelect?: string
  }

  export interface CourtCaseWarrantDateForm {
    'warrantDate-day'?: number
    'warrantDate-month'?: number
    'warrantDate-year'?: number
  }

  export interface CourtCaseSelectCourtNameForm {
    courtNameSelect?: string
  }

  export interface CourtCaseCourtNameForm {
    courtName?: string
  }

  export interface CourtCaseOverallCaseOutcomeForm {
    overallCaseOutcome?: string
  }

  export interface CourtCaseLookupCaseOutcomeForm {
    caseOutcome?: string
  }

  export interface CourtCaseCaseOutcomeAppliedAllForm {
    caseOutcomeAppliedAll?: string
  }

  export interface CourtCaseNextHearingSelectForm {
    nextHearingSelect?: string
  }

  export interface CourtCaseNextHearingTypeForm {
    nextHearingType?: string
  }

  export interface CourtCaseNextHearingDateForm {
    'nextHearingDate-year'?: string
    'nextHearingDate-month'?: string
    'nextHearingDate-day'?: string
    nextHearingTime?: string
  }

  export interface CourtCaseNextHearingCourtSelectForm {
    nextHearingCourtSelect?: string
  }

  export interface CourtCaseNextHearingCourtNameForm {
    nextHearingCourtName?: string
  }

  export interface OffenceOffenceDateForm {
    'offenceStartDate-day'?: number
    'offenceStartDate-month'?: number
    'offenceStartDate-year'?: number
    'offenceEndDate-day'?: number
    'offenceEndDate-month'?: number
    'offenceEndDate-year'?: number
  }

  export interface OffenceOffenceCodeForm {
    offenceCode?: string
    unknownCode?: string
  }

  export interface OffenceOffenceNameForm {
    offenceName?: string
  }

  export interface OffenceConfirmOffenceForm {
    offenceCode?: string
    offenceName?: string
  }

  export interface OffenceOffenceOutcomeForm {
    offenceOutcome?: string
  }

  export interface OffenceLookupOffenceOutcomeForm {
    offenceOutcome?: string
  }
  export interface OffenceDeleteOffenceForm {
    deleteOffence?: string
  }

  export interface ReviewOffencesForm {
    changeOffence?: string
  }

  export interface CourtCaseWarrantTypeForm {
    warrantType?: string
  }

  export interface CourtCaseTaggedBailForm {
    taggedBail?: string
  }

  export interface OffenceCountNumberForm {
    countNumber?: string
  }

  export interface OffenceTerrorRelatedForm {
    terrorRelated?: string
  }

  export interface OffenceSentenceLengthForm {
    'sentenceLength-years'?: string
    'sentenceLength-months'?: string
    'sentenceLength-weeks'?: string
    'sentenceLength-days'?: string
  }

  export interface OffenceAlternativeSentenceLengthForm {
    sentenceLengths: {
      value: string
      period: string
    }[]
  }
}
