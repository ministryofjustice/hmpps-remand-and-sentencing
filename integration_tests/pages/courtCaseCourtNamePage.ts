import Page, { PageElement } from './page'

export default class CourtCaseCourtNamePage extends Page {
  constructor() {
    super('What is the court name?')
  }

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')

  firstAutoCompleteOption = (): PageElement => cy.get('ul[id="court-name__listbox"]:first')
}
