import Page, { PageElement } from './page'

export default class CourtCaseTaskListPage extends Page {
  constructor(warrantType: string) {
    super(`Enter information from a ${warrantType} warrant`)
  }

  appearanceInformationLink = (): PageElement => cy.get('a:contains("Add appearance information")')

  sentencesLink = (): PageElement => cy.get('a:contains("Add Sentences")')

  taskList = (): PageElement => cy.get('.govuk-task-list')

  offencesLink = (): PageElement => cy.get('a:contains("Add Offences")')

  reviewOffencesLink = (): PageElement => cy.get('a:contains("Review offences")')

  nextCourtAppearanceLink = (): PageElement => cy.get('a:contains("Next court appearance")')

  addNextCourtAppearanceLink = (): PageElement => cy.get('a:contains("Add next court appearance")')
}
