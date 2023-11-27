declare module 'models' {
  export interface CourtCase {
    uniqueIdentifier?: string
    appearances?: CourtAppearance[]
  } // at some point this needs to change to appearance model

  export interface CourtAppearance {
    caseReferenceNumber?: string
    warrantDate?: Date
    courtName?: string
    nextHearingCourtSelect?: boolean
    nextHearingCourtName?: string
    overallCaseOutcome?: string
    caseOutcomeAppliedAll?: boolean
    nextHearingSelect?: boolean
    nextHearingType?: string
    nextHearingDate?: Date
    nextHearingTimeSet?: boolean
    offences?: Offence[]
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
    offenceCode?: string
    offenceName?: string
    outcome?: string
  }
}
