import Page, { PageElement } from './page'

export default class CourtCaseOverallSentenceLengthPage extends Page {
  constructor() {
    super('Enter the overall sentence length')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')
}
