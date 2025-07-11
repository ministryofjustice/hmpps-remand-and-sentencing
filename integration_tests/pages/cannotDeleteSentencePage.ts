import Page, { PageElement } from './page'

export default class CannotDeleteSentencePage extends Page {
  constructor() {
    super('You cannot delete this sentence')
  }

  appearanceDetails = (): PageElement => cy.get('[data-qa="appearanceDetails"]')
}
