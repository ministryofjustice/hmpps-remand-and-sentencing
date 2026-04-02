import Page, { PageElement } from './page'

export default class AggravatingFactorsDeleteAggravatingFactorPage extends Page {
  constructor() {
    super('Are you sure you want to delete the aggravating factors for this offence?')
  }

  deleteButton = (): PageElement => cy.get('[data-qa="delete-aggravating-button"]')

  listItems = (): PageElement => cy.get('.govuk-list--bullet')
}
