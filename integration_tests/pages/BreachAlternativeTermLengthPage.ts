import Page, { PageElement } from './page'

export default class BreachAlternativeTermPage extends Page {
  constructor() {
    super('Enter the term length of the breach')
  }

  sentenceLengthInput = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-value`)

  sentenceLengthDropDown = (prefix: string): PageElement => cy.get(`#${prefix}SentenceLength-period`)
}
