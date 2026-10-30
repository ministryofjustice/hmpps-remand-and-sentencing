import Page, { PageElement } from './page'

export default class ConfirmMarkSentenceAsActivePage extends Page {
  constructor() {
    super('Are you sure you want to mark this sentence as active?')
  }

  offenceSummary = (): PageElement => cy.get('[data-qa="offence-summary"]')

  confirmButton = (): PageElement => cy.get('[data-qa=confirm-button]')
}
