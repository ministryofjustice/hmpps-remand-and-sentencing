import Page, { PageElement } from './page'

export default class AppealCheckHearingAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  editCaseReferenceNumberLink = (): PageElement => cy.get('[data-qa=edit-case-reference-link]')

  editCriminalAppealOfficeReferenceLink = (): PageElement => cy.get('[data-qa=edit-criminal-appeal-reference-link]')

  editAppealDateLink = (): PageElement => cy.get('[data-qa=edit-appeal-date-link]')

  editCourtNameLink = (): PageElement => cy.get('[data-qa=edit-court-name-link]')

  editOverallCaseOutcomeLink = (): PageElement => cy.get('[data-qa=edit-overall-case-outcome-link]')
}
