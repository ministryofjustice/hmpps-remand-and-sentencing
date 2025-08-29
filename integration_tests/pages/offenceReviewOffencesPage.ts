import Page, { PageElement } from './page'

export default class OffenceReviewOffencesPage extends Page {
  constructor() {
    super('Review offences')
  }

  updateOutcomeLink = (chargeUuid: string): PageElement => cy.get(`[data-qa="update-outcome-link-${chargeUuid}"]`)
}
