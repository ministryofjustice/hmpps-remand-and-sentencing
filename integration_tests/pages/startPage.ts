import Page, { PageElement } from './page'

export default class StartPage extends Page {
  constructor() {
    super('Court cases')
  }

  courtCaseSummaryList = (courtCaseUuid: string): PageElement => cy.get(`[data-qa=courtCaseSummary-${courtCaseUuid}]`)

  courtCaseCard = (courtCaseUuid: string): PageElement => cy.get(`[data-qa=courtCaseCard-${courtCaseUuid}]`)

  recallInset = (courtCaseUuid: string): PageElement => cy.get(`[data-qa=recallInset-${courtCaseUuid}]`)

  courtCaseLatestAppearanceCaseReference = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=latestAppearanceCourtCaseReference-${courtCaseUuid}]`)

  courtCaseLatestAppearanceWarrantDate = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=latestAppearanceWarrantDate-${courtCaseUuid}]`)

  courtCaseLatestAppearanceLocation = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=latestAppearanceLocation-${courtCaseUuid}]`)

  courtCaseLatestAppearanceOutcome = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=latestAppearanceOutcome-${courtCaseUuid}]`)

  courtCaseDetailsComponent = (courtCaseUuid: string): PageElement =>
    cy.get(`[data-qa=courtCaseDetailsComponent-${courtCaseUuid}]`)

  courtCasesContent = (): PageElement => cy.get('[data-qa=court-cases]')

  actionListLink = (): PageElement => cy.get('.actions-list a')

  sortLink = (sortBy: string): PageElement => cy.get(`a[href="/person/A1234AB?sortBy=${sortBy}"]`)

  addAppearanceLink = (courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href="/person/A1234AB/edit-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/new-journey"]`,
    )
}
