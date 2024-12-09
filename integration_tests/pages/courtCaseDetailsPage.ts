import Page, { PageElement } from './page'

export default class CourtCaseDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearancesTab = (): PageElement => cy.get('[id=appearances]')
}
