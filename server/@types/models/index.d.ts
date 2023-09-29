declare module 'models' {
  export interface CourtCase {
    referenceNumber?: string
    warrantDate?: Date
    courtName?: string
    nextCourtDate?: Date
  }

  export interface Offence {
    offenceStartDate?: Date
    offenceEndDate?: Date
  }
}
