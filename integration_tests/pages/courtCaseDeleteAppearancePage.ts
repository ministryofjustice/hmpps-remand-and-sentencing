import Page, { PageElement } from './page'

export default class CourtCaseDeleteAppearancePage extends Page {
  constructor() {
    super(`Are you sure you want to delete this appearance?`)
  }

  deleteButton = (): PageElement => cy.get('[data-qa=delete-button]')
}
