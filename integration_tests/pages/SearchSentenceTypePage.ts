import Page, { PageElement } from './page'

export default class SearchSentenceTypePage extends Page {
  constructor() {
    super('Search Sentence Type')
  }

  searchButton = (): PageElement => cy.get('[data-qa="search-button"]')

  convictionDateInput = (): PageElement => cy.get('#convictionDate')

  offenceDateInput = (): PageElement => cy.get('#offenceDate')

  ageAtConvictionInput = (): PageElement => cy.get('#ageAtConviction')

  content = (): PageElement => cy.get('[data-qa="content"]')
}
