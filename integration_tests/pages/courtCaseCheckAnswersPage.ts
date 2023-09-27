import Page, { PageElement } from './page'

export default class CourtCaseCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  summaryList = (): PageElement => cy.get('.govuk-summary-list')
}
