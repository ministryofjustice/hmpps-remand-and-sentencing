import Page, { PageElement } from './page'

export default class CourtCaseDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearancesTab = (): PageElement => cy.get('[data-qa=appearances-tab]')

  draftsTab = (): PageElement => cy.get('[data-qa=drafts-tab]')

  appearanceActionList = (appearanceUuid: string): PageElement =>
    cy.get(`[data-qa=appearanceActionList-${appearanceUuid}]`)
}
