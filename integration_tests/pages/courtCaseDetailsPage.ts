import Page, { PageElement } from './page'

export default class CourtCaseDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearancesSummaryList = (): PageElement => cy.get('[data-qa=appearancesSummaryList]')

  appearancesTable = (): PageElement => cy.get('[data-qa=appearancesTable]')
}
