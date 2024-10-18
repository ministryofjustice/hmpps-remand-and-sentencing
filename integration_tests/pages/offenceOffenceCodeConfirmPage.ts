import Page, { PageElement } from './page'

export default class OffenceOffenceCodeConfirmPage extends Page {
  constructor() {
    super('Confirm the offence')
  }

  offenceSummaryList = (): PageElement => cy.get('[data-qa=offenceSummaryList]')
}
