import Page, { PageElement } from './page'

export default class EditChargeOutcome extends Page {
  constructor() {
    super('Edit Charge Outcome')
  }

  outcomeNameInput = (): PageElement => cy.get('#outcomeName')

  nomisCodeInput = (): PageElement => cy.get('#nomisCode')

  displayOrderInput = (): PageElement => cy.get('#displayOrder')
}
