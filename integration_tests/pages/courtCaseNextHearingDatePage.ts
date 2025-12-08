import Page, { PageElement } from './page'

export default class CourtCaseNextHearingDatePage extends Page {
  constructor() {
    super('Enter the date of the next court appearance')
  }

  nextHearingTimeInput = (): PageElement => cy.get('#nextHearingTime')
}
