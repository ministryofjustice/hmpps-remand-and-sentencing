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
}
