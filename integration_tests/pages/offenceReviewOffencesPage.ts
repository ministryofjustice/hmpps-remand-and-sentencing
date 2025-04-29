import Page, { PageElement } from './page'

export default class OffenceReviewOffencesPage extends Page {
  constructor() {
    super('Review offences')
  }

  updateOutcomeLink = (
    personId: string,
    courtCaseReference: string,
    appearanceReference: string,
    offenceReference: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/offences/${offenceReference}/update-offence-outcome"]`,
    )
}
