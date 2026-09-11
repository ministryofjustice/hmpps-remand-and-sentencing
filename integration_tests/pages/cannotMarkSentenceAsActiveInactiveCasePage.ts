import Page, { PageElement } from './page'

export default class CannotMarkSentenceAsActiveInactiveCasePage extends Page {
  constructor() {
    super('You cannot mark a sentence as active from an inactive court case')
  }

  cancelAndGoBackButton = (): PageElement => cy.get('[data-qa="cancel-and-go-back-button"]')
}
