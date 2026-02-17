import Page, { PageElement } from './page'

export default class AddChargeOutcome extends Page {
  constructor() {
    super('Add Charge Outcome')
  }

  outcomeNameInput = (): PageElement => cy.get('#outcomeName')

  nomisCodeInput = (): PageElement => cy.get('#nomisCode')

  displayOrderInput = (): PageElement => cy.get('#displayOrder')
}
