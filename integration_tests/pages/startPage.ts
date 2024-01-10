import Page, { PageElement } from './page'

export default class StartPage extends Page {
  constructor() {
    super('Start Page')
  }

  courtCaseSummaryList = (courtCaseUuid: string): PageElement => cy.get(`[data-qa=courtCaseSummary-${courtCaseUuid}]`)
}
