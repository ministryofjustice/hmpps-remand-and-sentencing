import Page, { PageElement } from './page'

export default class OffenceDeleteOffencePage extends Page {
  constructor() {
    super(`Are you sure you want to delete this offence?`)
  }

  deleteButton = (): PageElement => cy.get('[data-qa=delete-button]')
}
