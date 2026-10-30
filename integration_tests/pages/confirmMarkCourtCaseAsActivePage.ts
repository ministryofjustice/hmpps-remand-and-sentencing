import Page, { PageElement } from './page'

export default class ConfirmMarkCourtCaseAsActivePage extends Page {
  constructor() {
    super('Are you sure you want to mark this court case as active?')
  }

  subheading = (): PageElement => cy.get('[data-qa="confirm-mark-court-case-status-subheading"]')

  confirmAndContinueButton = (): PageElement => cy.get('[data-qa=confirm-and-continue-button]')
}
