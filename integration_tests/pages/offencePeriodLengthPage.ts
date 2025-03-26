import Page, { PageElement } from './page'

export default class OffencePeriodLengthPage extends Page {
  constructor(periodType: string) {
    super(`Enter the ${periodType}`)
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')
}
