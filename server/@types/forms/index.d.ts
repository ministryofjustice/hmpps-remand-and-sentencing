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
}
