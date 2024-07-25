import Page, { PageElement } from './page'

export default class OffenceDeleteOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Edit ${sentenceOffence} details`)
  }

  editFieldLink = (
    personId: string,
    addOrEdit: string,
    courtCaseReference: string,
    appearanceReference: string,
    offenceReference: string,
    page: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/${addOrEdit}-court-case/${courtCaseReference}/${addOrEdit}-court-appearance/${appearanceReference}/offences/${offenceReference}/${page}?submitToEditOffence=true"]`,
    )
}
