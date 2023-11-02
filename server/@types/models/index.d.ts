declare module 'models' {
  export interface CourtCase {
    referenceNumber?: string
    warrantDate?: Date
    courtName?: string
    overallCaseOutcome?: string
    caseOutcomeAppliedAll?: boolean
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
  }
}
