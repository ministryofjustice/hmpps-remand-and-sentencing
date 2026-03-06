import Page, { PageElement } from './page'

export default class CourtCaseCourtNamePage extends Page {
  constructor(title: string) {
    super(title)
  }

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')

  firstAutoCompleteOption = (): PageElement => cy.get('#court-name__option--0')
}
