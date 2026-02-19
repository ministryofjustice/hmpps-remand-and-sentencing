import Page, { PageElement } from './page'

export default class AddAppearanceOutcome extends Page {
  constructor() {
    super('Add Appearance Outcome')
  }

  outcomeNameInput = (): PageElement => cy.get('#outcomeName')

  nomisCodeInput = (): PageElement => cy.get('#nomisCode')

  displayOrderInput = (): PageElement => cy.get('#displayOrder')
}
