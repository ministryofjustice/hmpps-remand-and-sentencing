import Page, { PageElement } from './page'

export default class CourtCaseTaskListPage extends Page {
  constructor() {
    super('Add a court case')
  }

  appearanceInformationLink = (): PageElement => cy.get('a:contains("Add appearance information")')

  sentencesLink = (): PageElement => cy.get('a:contains("Add Sentences")')

  taskList = (): PageElement => cy.get('.govuk-task-list')

  offencesLink = (): PageElement => cy.get('a:contains("Add Offences")')
}
