declare module 'forms' {
  export interface CourtCaseReferenceForm {
    referenceNumber?: string
  }

  export interface CourtCaseWarrantDateForm {
    'warrantDate-day'?: number
    'warrantDate-month'?: number
    'warrantDate-year'?: number
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

  export interface CourtCaseNextHearingCourtSelectForm {
    nextHearingCourtSelect?: string
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
}
