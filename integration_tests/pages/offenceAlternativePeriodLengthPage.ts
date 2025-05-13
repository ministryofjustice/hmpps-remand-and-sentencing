import Page, { PageElement } from './page'

export default class OffenceAlternativePeriodLengthPage extends Page {
  constructor(periodType: string) {
    super(`Enter the ${periodType}`)
  }

  sentenceLengthInput = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-value`)
}
