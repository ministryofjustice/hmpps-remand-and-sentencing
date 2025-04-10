import Page, { PageElement } from './page'

export default class OffenceUpdateOffenceOutcomesPage extends Page {
  constructor() {
    super('Update offence outcomes')
  }

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')

  sentenceLengthSection = (): PageElement => cy.get('[data-qa="overallSentenceLengthComparison"]')

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
