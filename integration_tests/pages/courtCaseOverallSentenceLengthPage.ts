import Page, { PageElement } from './page'

export default class CourtCaseOverallSentenceLengthPage extends Page {
  constructor() {
    super('Is there an overall sentence length on the warrant?')
  }

  monthsInput = (): PageElement => cy.get('#sentenceLength-months')

  yearsInput = (): PageElement => cy.get('#sentenceLength-years')

  weeksInput = (): PageElement => cy.get('#sentenceLength-weeks')

  daysInput = (): PageElement => cy.get('#sentenceLength-days')

  warrantInformationCaption = (): PageElement => cy.get('[data-qa=warrant-information-caption]')

  editAlternativeLink = (personId: string, courtCaseReference: string, appearanceReference: string): PageElement =>
    cy.get(
      `a[href="/person/${personId}/edit-court-case/${courtCaseReference}/edit-court-appearance/${appearanceReference}/sentencing/alternative-overall-sentence-length"]`,
    )
}
