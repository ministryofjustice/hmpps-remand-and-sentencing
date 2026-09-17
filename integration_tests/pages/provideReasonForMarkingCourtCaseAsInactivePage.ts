import Page, { PageElement } from './page'

export default class ProvideReasonForMarkingCourtCaseAsInactivePage extends Page {
  constructor() {
    super('Provide a reason you want to mark this case as inactive')
  }

  hint = (): PageElement => cy.get('[data-qa="provide-reason-for-marking-court-case-as-inactive-hint"]')

  reasonTextarea = (): PageElement => cy.get('[data-qa=reason-textarea]')

  confirmAndSaveButton = (): PageElement => cy.get('[data-qa=confirm-and-save-button]')
}
