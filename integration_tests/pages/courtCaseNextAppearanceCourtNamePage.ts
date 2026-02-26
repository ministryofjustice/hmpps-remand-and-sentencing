import Page, { PageElement } from './page'

export default class CourtCaseNextAppearanceCourtNamePage extends Page {
  constructor() {
    super('What court is the next appearance at?')
  }

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')

  secondAutoCompleteOption = (): PageElement => cy.get('[id="next-appearance-court-name__option--1"]')
}
