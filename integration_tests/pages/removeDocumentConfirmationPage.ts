import Page from './page'

export default class RemoveDocumentConfirmationPage extends Page {
  constructor() {
    super('Are you sure you want to delete this document?')
  }

  get fileName() {
    return cy.get('.govuk-link')
  }
}
