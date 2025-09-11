import Page, { PageElement } from './page'

export default class CourtCaseTaskListPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearanceInformationLink = (): PageElement => cy.get('a:contains("Add appearance information")')

  taskList = (): PageElement => cy.get('.govuk-task-list')

  offencesLink = (): PageElement => cy.get('a:contains("Add offences")')

  warrantInformationLink = (): PageElement => cy.get('a:contains("Add overall warrant information")')

  reviewOffencesLink = (): PageElement => cy.get('a:contains("Review offences")')

  updateOffenceOutcomesLink = (): PageElement => cy.get('a:contains("Update offence outcomes")')

  nextCourtAppearanceLink = (): PageElement => cy.get('a:contains("Next court appearance")')

  saveDraftParagraph = (): PageElement =>
    cy.get('p:contains("To save a draft of the court case, you must first complete the appearance information.")')

  submitDraftButton = (): PageElement => cy.get('[data-qa=submitDraft]')
}
