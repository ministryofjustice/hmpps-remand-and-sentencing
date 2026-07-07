import Page, { PageElement } from './page'

export default class BreachCourtNamePage extends Page {
  constructor() {
    super('Which court heard the breach?')
  }

  firstAutoCompleteOption = (): PageElement => cy.get('#court-name__option--0')

  secondAutoCompleteOption = (): PageElement => cy.get('#court-name__option--1')
}
