import Page, { PageElement } from './page'

export default class OffenceSentenceLengthPage extends Page {
  constructor() {
    super('Enter the sentence length')
  }

  sentenceLengthInput = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-value`)
}
