import Page, { PageElement } from './page'

export default class OffenceReviewOffencesPage extends Page {
  constructor() {
    super('Review offences')
  }

  updateOutcomeLink = (offenceReference: string): PageElement =>
    cy.get(`[data-qa="update-outcome-link-${offenceReference}"]`)
}
