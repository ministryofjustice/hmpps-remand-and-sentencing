import Page, { PageElement } from './page'

export default class OffenceReviewOffencesPage extends Page {
  constructor() {
    super('Review offences')
  }

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')
}
