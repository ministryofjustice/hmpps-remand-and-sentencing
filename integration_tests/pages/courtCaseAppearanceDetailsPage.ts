import Page, { PageElement } from './page'

export default class CourtCaseAppearanceDetailsPage extends Page {
  constructor(title: string) {
    super(title)
  }

  appearanceSummaryList = (): PageElement => cy.get('[data-qa=appearanceSummaryList]')

  nextHearingSummaryList = (): PageElement => cy.get('[data-qa=nextHearingSummaryList]')
}
