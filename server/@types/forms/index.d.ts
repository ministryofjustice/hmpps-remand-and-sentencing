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

  export interface CourtCaseNextCourtDateQuestionForm {
    nextCourtDateKnown?: string
  }

  export interface CourtCaseNextCourtDateForm {
    'nextCourtDate-day'?: number
    'nextCourtDate-month'?: number
    'nextCourtDate-year'?: number
    nextCourtTime?: string
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
}
