import Page, { PageElement } from './page'

export default class CourtCaseOverallSentenceLengthPage extends Page {
  constructor() {
    super('Is there an overall sentence length on the warrant?')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')
}
