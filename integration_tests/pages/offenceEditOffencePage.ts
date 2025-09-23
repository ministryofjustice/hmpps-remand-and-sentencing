import Page, { PageElement } from './page'

export default class OffenceEditOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Edit ${sentenceOffence} details`)
  }

  editFieldLink = (chargeUuid: string, page: string): PageElement => cy.get(`a[data-qa="edit-${page}-${chargeUuid}"]`)

  editPeriodLengthLink = (
    personId: string,
    addOrEdit: string,
    courtCaseReference: string,
    appearanceReference: string,
    chargeUuid: string,
    periodLengthType: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/${addOrEdit}-court-case/${courtCaseReference}/${addOrEdit}-court-appearance/${appearanceReference}/offences/${chargeUuid}/period-length?periodLengthType=${periodLengthType}&submitToEditOffence=true"]`,
    )

  editSummaryList = (): PageElement => cy.get('[data-qa=edit-summary-list]')

  cancelEditLink = (): PageElement => cy.get('[data-qa=cancel-edit-offence]')

  updateOutcomeCta = (): PageElement => cy.get('[data-qa=update-outcome-cta]')
}
