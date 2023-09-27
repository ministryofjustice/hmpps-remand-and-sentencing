import Page, { PageElement } from './page'

export default class CourtCaseCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  summaryList = (): PageElement => cy.get('.govuk-summary-list')

  changeLink = (personId: string, page: string): PageElement =>
    cy.get(`a[href="/person/${personId}/court-cases/${page}?submitToCheckAnswers=true"]`)
}
