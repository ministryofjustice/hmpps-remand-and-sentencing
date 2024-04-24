import Page, { PageElement } from './page'

export default class OffenceDeleteOffencePage extends Page {
  constructor(sentenceOffence: string) {
    super(`Edit ${sentenceOffence} details`)
  }

  editFieldLink = (
    personId: string,
    courtCaseReference: string,
    appearanceReference: string,
    offenceReference: string,
    page: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/offences/${offenceReference}/${page}?submitToEditOffence=true"]`,
    )
}
