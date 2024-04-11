import Page, { PageElement } from './page'

export default class CourtCaseTaskListPage extends Page {
  constructor() {
    super('Add a court case')
  }

  appearanceInformationLink = (): PageElement => cy.get('a:contains("Appearance information")')
}
