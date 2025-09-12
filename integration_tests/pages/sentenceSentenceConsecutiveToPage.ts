import Page, { PageElement } from './page'

export default class SentenceConsecutiveToPage extends Page {
  constructor() {
    super('Which sentence is this sentence consecutive to?')
  }

  sentencesOnOtherCasesHeader = (): PageElement => cy.get('[data-qa=sentencesOnOtherCasesHeader]')

  sentencesOnSameCaseRadio = (position: number): PageElement =>
    cy.contains('h2', 'Sentences on this case').nextAll('.govuk-radios__item').eq(position).find('input[type="radio"]')
}
