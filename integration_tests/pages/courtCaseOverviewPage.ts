import Page from './page'

export default class CourtCaseOverviewPage extends Page {
  constructor(courtCaseReference: string) {
    super(`Court case ${courtCaseReference}`)
  }
}
