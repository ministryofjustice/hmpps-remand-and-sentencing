import Page, { PageElement } from './page'

export default class CourtCaseNextAppearanceCourtNamePage extends Page {
  constructor() {
    super('What court is the next appearance at?')
  }

  autoCompleteInput = (): PageElement => cy.get('#next-appearance-court-name')

  secondAutoCompleteOption = (): PageElement => cy.get('#next-appearance-court-name__option--1')
}
