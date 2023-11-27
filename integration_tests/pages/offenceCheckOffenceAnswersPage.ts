import Page from './page'

export default class CourtCaseOverviewPage extends Page {
  constructor(offenceCount: number, courtCaseReference: string) {
    super(`You have added ${offenceCount} offences to case ${courtCaseReference}`)
  }
}
