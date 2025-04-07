import Page, { PageElement } from './page'

export default class CourtCaseAlternativeSentenceLengthPage extends Page {
  constructor() {
    super('Enter the overall sentence length')
  }

  sentenceLengthInput = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-value`)

  sentenceLengthDropDown = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-period`)
}
