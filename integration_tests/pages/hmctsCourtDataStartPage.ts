import Page, { PageElement } from './page'

export default class HmctsCourtDataStartPage extends Page {
  constructor() {
    super('Review new documents and add a court case')
  }

  continueLink = (): PageElement => cy.get('[data-qa=hmcts-court-data-continue]')
}
