import Page, { PageElement } from './page'

export default class CourtCaseDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearancesTab = (): PageElement => cy.get('[data-qa=appearances-tab]')

  draftsTab = (): PageElement => cy.get('[data-qa=drafts-tab]')

  appearanceActionList = (appearanceUuid: string): PageElement =>
    cy.get(`[data-qa=appearanceActionList-${appearanceUuid}]`)

  editAppearanceLink = (courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href*="/person/A1234AB/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}/remand/load-appearance-details"]`,
    )
}
