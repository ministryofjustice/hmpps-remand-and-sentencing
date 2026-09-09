import Page, { PageElement } from './page'

export default class CannotMarkSentenceAsActiveConsecutiveChainPage extends Page {
  constructor() {
    super('You cannot mark this sentence as active')
  }

  cancelAndGoBackButton = (): PageElement => cy.get('[data-qa="cancel-and-go-back-button"]')
}
