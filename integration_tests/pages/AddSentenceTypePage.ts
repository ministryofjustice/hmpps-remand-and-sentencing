import Page, { PageElement } from './page'

export default class AddSentenceType extends Page {
  constructor() {
    super('Add Sentence Type')
  }

  descriptionInput = (): PageElement => cy.get('#description')

  nomisCjaCodeInput = (): PageElement => cy.get('#nomisCjaCode')

  displayOrderInput = (): PageElement => cy.get('#displayOrder')
}
