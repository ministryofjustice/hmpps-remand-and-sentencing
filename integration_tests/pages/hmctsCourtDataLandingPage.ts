import Page, { PageElement } from './page'

export default class HmctsCourtDataLandingPage extends Page {
  constructor(title: string) {
    super(title)
  }

  commonPlatformText = (): PageElement => cy.get('[data-qa=common-platform-text]')
}
