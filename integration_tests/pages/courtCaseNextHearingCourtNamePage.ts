import Page, { PageElement } from './page'

export default class CourtCaseNextHearingSetPage extends Page {
  constructor() {
    super('What court is the next hearing at?')
  }

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')

  firstAutoCompleteOption = (): PageElement => cy.get('ul[id="next-hearing-court-name__listbox"]:first')
}
