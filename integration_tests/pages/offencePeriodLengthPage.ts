import Page, { PageElement } from './page'

export default class OffencePeriodLengthPage extends Page {
  constructor() {
    super('Enter the sentence length')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')
}
