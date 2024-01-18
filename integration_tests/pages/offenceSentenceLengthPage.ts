import Page, { PageElement } from './page'

export default class OffenceSentenceLengthPage extends Page {
  constructor() {
    super('Enter the sentence length')
  }

  monthsInput = (): PageElement => cy.get('#sentence-length-months')

  yearsInput = (): PageElement => cy.get('#sentence-length-years')
}
