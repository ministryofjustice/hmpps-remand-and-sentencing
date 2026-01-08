import Page, { PageElement } from './page'

export default class CourtCaseDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearancesSection = (): PageElement => cy.get('[data-qa=appearances-section]')

  draftsTab = (): PageElement => cy.get('[data-qa=drafts-tab]')

  appearanceActionList = (appearanceUuid: string): PageElement =>
    cy.get(`[data-qa=appearanceActionList-${appearanceUuid}]`)

  editAppearanceLink = (courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href*="/person/A1234AB/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}/non-sentencing/load-appearance-details"]`,
    )

  deleteAppearanceLink = (courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(`a[href*="/person/A1234AB/edit-court-case/${courtCaseReference}/${appearanceReference}/confirm-delete"]`)

  mergedCaseInset = (): PageElement => cy.get(`[data-qa=mergedFromText]`)

  notificationBanner = (): PageElement => cy.get('.govuk-notification-banner')

  notificationBannerContent = (): PageElement => cy.get('[data-qa=notification-banner-content]')
}
