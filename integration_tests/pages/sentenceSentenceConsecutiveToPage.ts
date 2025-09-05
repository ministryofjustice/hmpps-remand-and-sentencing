import Page, { PageElement } from './page'

export default class SentenceConsecutiveToPage extends Page {
  constructor() {
    super('Which sentence is this sentence consecutive to?')
  }

  sentencesOnOtherCasesHeader = (): PageElement => cy.get('[data-qa=sentencesOnOtherCasesHeader]')
}
