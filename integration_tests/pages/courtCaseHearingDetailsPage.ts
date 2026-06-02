import Page, { PageElement } from './page'

export default class CourtCaseAppearanceDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  confirmButton = (): PageElement => cy.get('[data-qa=confirm-button]')

  hearingSummaryList = (): PageElement => cy.get('[data-qa=hearingSummaryList]')

  nextAppearanceSummaryList = (): PageElement => cy.get('[data-qa=nextAppearanceSummaryList]')

  overallSummaryList = (): PageElement => cy.get('[data-qa=overallSummaryList]')

  allOffences = (): PageElement => cy.get('[data-qa=allOffences]')

  mergedCaseInset = (): PageElement => cy.get(`[data-qa=mergedFromText]`)

  editFieldLink = (
    personId: string,
    courtCaseReference: string,
    appearanceReference: string,
    page: string,
    sentencing: boolean = false,
  ): PageElement => {
    const sentencingPath = sentencing ? '/sentencing' : ''
    return cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}${sentencingPath}/${page}"]`,
    )
  }

  editOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/edit-court-appearance/${appearanceReference}/offences/${chargeUuid}/load-edit-offence"]`,
    )

  deleteOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    journey: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/edit-court-appearance/${appearanceReference}/${journey}/offences/${chargeUuid}/check-delete-offence"]`,
    )

  selectConsecutiveConcurrentLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/edit-court-appearance/${appearanceReference}/offences/${chargeUuid}/select-consecutive-concurrent"]`,
    )

  updateOffenceOutcomeLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseId}/edit-court-appearance/${appearanceReference}/appeals/offences/${chargeUuid}/select-appeal-outcome"]`,
    )

  notificationBannerContent = (): PageElement => cy.get('[data-qa="notification-banner-content"]')
}
