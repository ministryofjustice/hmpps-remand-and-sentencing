import Page, { PageElement } from './page'

export default class CannotMarkSentencesAsInactivePage extends Page {
  constructor() {
    super('You cannot mark a sentence inactive with active consecutive sentences')
  }

  activeConsecutiveOffences = (): PageElement => cy.get('[data-qa^="activeConsecutiveOffence-"]')

  goBackToSelectSentencesLink = (): PageElement => cy.get('[data-qa="go-back-to-select-sentences-link"]')
}
