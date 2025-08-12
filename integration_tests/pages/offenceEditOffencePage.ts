import Page, { PageElement } from './page'

export default class OffenceEditOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Edit ${sentenceOffence} details`)
  }

  editFieldLink = (offenceReference: string, page: string): PageElement =>
    cy.get(`a[data-qa="edit-${page}-${offenceReference}"]`)

  editPeriodLengthLink = (
    personId: string,
    addOrEdit: string,
    courtCaseReference: string,
    appearanceReference: string,
    offenceReference: string,
    periodLengthType: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/${addOrEdit}-court-case/${courtCaseReference}/${addOrEdit}-court-appearance/${appearanceReference}/offences/${offenceReference}/period-length?periodLengthType=${periodLengthType}&submitToEditOffence=true"]`,
    )
}
