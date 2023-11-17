declare module 'models' {
  export interface CourtCase {
    referenceNumber?: string
    warrantDate?: Date
    courtName?: string
    overallCaseOutcome?: string
    caseOutcomeAppliedAll?: boolean
    nextHearingSelect?: boolean
    nextHearingType?: string
    nextHearingCourtSelect?: boolean
    nextCourtName?: string
  } // at some point this needs to change to appearance model

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    offenceName?: string
  }
}
