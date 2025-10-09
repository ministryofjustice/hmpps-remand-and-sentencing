import Page, { PageElement } from './page'

export default class SentencingCorrectManyPeriodLengthPage extends Page {
  constructor(periodType: string) {
    super(`Select the correct ${periodType} for this sentence`)
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')
}
