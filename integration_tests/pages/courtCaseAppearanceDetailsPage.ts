import Page, { PageElement } from './page'

export default class CourtCaseAppearanceDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  confirmButton = (): PageElement => cy.get('[data-qa=confirm-button]')

  appearanceSummaryList = (): PageElement => cy.get('[data-qa=appearanceSummaryList]')

  nextHearingSummaryList = (): PageElement => cy.get('[data-qa=nextHearingSummaryList]')

  offenceSummaryList = (): PageElement => cy.get('[data-qa=offenceSummaryList]')

  allOffences = (): PageElement => cy.get('[data-qa=allOffences]')

  editFieldLink = (
    personId: string,
    courtCaseReference: string,
    appearanceReference: string,
    page: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}/${page}"]`,
    )

  editOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    offenceId: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/edit-court-appearance/${appearanceReference}/offences/${offenceId}/edit-offence"]`,
    )
}
