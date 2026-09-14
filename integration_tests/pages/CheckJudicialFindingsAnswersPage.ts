import Page, { PageElement } from './page'

export default class CheckJudicialFindingsAnswersPage extends Page {
  constructor() {
    super('Judicial findings have been applied')
  }

  pageContent = (): PageElement => cy.get('[data-qa="page-content"]')
}
