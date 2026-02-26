import Page, { PageElement } from './page'

export default class CourtCaseCourtNamePage extends Page {
  constructor(title: string) {
    super(title)
  }

  autoCompleteInput = (): PageElement => cy.get('#court-name')

  firstAutoCompleteOption = (): PageElement => cy.get('#court-name__option--0')
}
