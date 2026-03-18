import Page, { PageElement } from './page'

export default class CourtCaseOverallConvictionDatePage extends Page {
  constructor() {
    super('Is the conviction date the same for all offences on the warrant?')
  }

  hintText = (): PageElement => cy.get('#overallConvictionDateAppliedAll-hint')
}
