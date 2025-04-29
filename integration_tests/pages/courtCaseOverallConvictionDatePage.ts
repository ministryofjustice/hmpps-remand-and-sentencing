import Page, { PageElement } from './page'

export default class CourtCaseOverallConvictionDatePage extends Page {
  constructor() {
    super('Is the conviction date the same for all offences on the warrant?')
  }

  hintInset = (): PageElement => cy.get('[data-qa=hintInset]')
}
