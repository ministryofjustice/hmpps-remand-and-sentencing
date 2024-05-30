import Page, { PageElement } from './page'

export default class StartPage extends Page {
  constructor() {
    super('Court cases')
  }

  courtCaseSummaryList = (courtCaseUuid: string): PageElement => cy.get(`[data-qa=courtCaseSummary-${courtCaseUuid}]`)

  courtCaseAppearanceTable = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=courtCaseAppearanceTable-${courtCaseUuid}]`)

  courtCaseDetailsComponent = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=courtCaseDetailsComponent-${courtCaseUuid}]`)

  actionListLink = (): PageElement => cy.get('.actions-list a')

  sortLink = (sortBy: string): PageElement => cy.get(`a[href="/person/A1234AB?sortBy=${sortBy}"]`)

  addAppearanceLink = (courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href="/person/A1234AB/edit-court-case/${courtCaseReference}/appearance/${appearanceReference}/warrant-type"]`,
    )
}
