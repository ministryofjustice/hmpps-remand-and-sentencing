import Page, { PageElement } from './page'

export default class ConfirmMarkCourtCaseStatusPage extends Page {
  constructor(title: string) {
    super(title)
  }

  subheading = (): PageElement => cy.get('[data-qa="confirm-mark-court-case-status-subheading"]')

  confirmAndContinueButton = (): PageElement => cy.get('[data-qa=confirm-and-continue-button]')
}
