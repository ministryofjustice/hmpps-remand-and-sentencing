import Page, { PageElement } from './page'

export default class BreachCheckHearingAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  editCaseReferenceNumberLink = (): PageElement => cy.get('[data-qa=edit-case-reference-link]')

  editBreachDateLink = (): PageElement => cy.get('[data-qa=edit-breach-date-link]')

  editCourtNameLink = (): PageElement => cy.get('[data-qa=edit-court-name-link]')
}
