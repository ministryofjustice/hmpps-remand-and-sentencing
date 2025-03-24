import Page, { PageElement } from './page'

export default class OffenceSentenceTypePage extends Page {
  constructor() {
    super('Enter the sentence length')
  }

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')
}
