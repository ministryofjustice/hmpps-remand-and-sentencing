import Page, { PageElement } from './page'

export default class CourtCaseOverviewPage extends Page {
  constructor(offenceCount: number, courtCaseReference: string) {
    super(`You have added ${offenceCount} offences to case ${courtCaseReference}`)
  }

  deleteOffenceLink = (personId: string, courtCaseId: string, offenceId: string): PageElement =>
    cy.get(`a[href="/person/${personId}/court-cases/${courtCaseId}/offences/${offenceId}/delete-offence"]`)
}
