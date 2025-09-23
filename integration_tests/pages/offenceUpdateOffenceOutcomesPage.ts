import Page, { PageElement } from './page'

export default class OffenceUpdateOffenceOutcomesPage extends Page {
  constructor() {
    super('Update offence outcomes')
  }

  sentenceLengthSection = (): PageElement => cy.get('[data-qa="overallSentenceLengthComparison"]')

  updateOutcomeLink = (chargeUuid: string): PageElement => cy.get(`[data-qa="update-outcome-link-${chargeUuid}"]`)

  offencesNeedUpdating = (): PageElement => cy.get('[data-qa=offencesNeedUpdating]')

  editOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/add-court-appearance/${appearanceReference}/offences/${chargeUuid}/load-edit-offence"]`,
    )
}
