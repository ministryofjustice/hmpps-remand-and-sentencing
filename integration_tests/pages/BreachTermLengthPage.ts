import Page, { PageElement } from './page'

export default class BreachTermLengthPage extends Page {
  constructor() {
    super('Enter the breach term length')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')

  editAlternativeLink = (personId: string, courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}/breach/alternative-breach-term-length"]`,
    )
}
