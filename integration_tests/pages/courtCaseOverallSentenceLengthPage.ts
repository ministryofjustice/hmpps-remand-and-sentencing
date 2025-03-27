import Page, { PageElement } from './page'

export default class CourtCaseOverallSentenceLengthPage extends Page {
  constructor() {
    super('Is there an overall sentence length on the warrant?')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')

  offencesCaption = (): PageElement => cy.get('[data-qa=offences-caption]')
}
