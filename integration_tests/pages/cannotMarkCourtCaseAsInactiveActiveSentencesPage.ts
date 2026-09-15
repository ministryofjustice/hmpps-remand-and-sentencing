import Page, { PageElement } from './page'

export default class CannotMarkCourtCaseAsInactiveActiveSentencesPage extends Page {
  constructor() {
    super('You cannot mark a case with active sentences as inactive')
  }

  cancelAndGoBackButton = (): PageElement => cy.get('[data-qa="cancel-and-go-back-button"]')
}
