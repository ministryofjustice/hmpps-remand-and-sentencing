import Page, { PageElement } from './page'

export default class EditSentenceTypePage extends Page {
  constructor() {
    super('Edit Sentence Type')
  }

  descriptionInput = (): PageElement => cy.get('#description')

  nomisCjaCodeInput = (): PageElement => cy.get('#nomisCjaCode')

  displayOrderInput = (): PageElement => cy.get('#displayOrder')
}
