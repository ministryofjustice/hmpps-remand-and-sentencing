import Page, { PageElement } from './page'

export default class DeleteJudicialFindingsOffencePage extends Page {
  constructor() {
    super('Are you sure you want to delete the judicial findings?')
  }

  deleteButton = (): PageElement => cy.get('[data-qa="delete-button"]')
}
