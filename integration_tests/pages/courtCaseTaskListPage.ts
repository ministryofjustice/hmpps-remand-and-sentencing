import Page, { PageElement } from './page'

export default class CourtCaseTaskListPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearanceInformationLink = (): PageElement => cy.get('a:contains("Add appearance information")')

  sentencesLink = (): PageElement => cy.get('a:contains("Add offences")')

  taskList = (): PageElement => cy.get('.govuk-task-list')

  offencesLink = (): PageElement => cy.get('a:contains("Add offences")')

  reviewOffencesLink = (): PageElement => cy.get('a:contains("Review offences")')

  nextCourtAppearanceLink = (): PageElement => cy.get('a:contains("Next court appearance")')

  addNextCourtAppearanceLink = (): PageElement => cy.get('a:contains("Add next court appearance")')
}
