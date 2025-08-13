import Page, { PageElement } from './page'

export default class OffenceUpdateOffenceOutcomesPage extends Page {
  constructor() {
    super('Update offence outcomes')
  }

  sentenceLengthSection = (): PageElement => cy.get('[data-qa="overallSentenceLengthComparison"]')

  updateOutcomeLink = (offenceReference: string): PageElement =>
    cy.get(`[data-qa="update-outcome-link-${offenceReference}"]`)

  editOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    offenceId: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/add-court-appearance/${appearanceReference}/offences/${offenceId}/load-edit-offence"]`,
    )
}
