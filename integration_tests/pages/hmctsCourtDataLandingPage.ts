import Page, { PageElement } from './page'

export default class HmctsCourtDataLandingPage extends Page {
  constructor() {
    super('Review new documents and add a court case')
  }

  commonPlatformText = (): PageElement => cy.get('[data-qa=common-platform-text]')
}
