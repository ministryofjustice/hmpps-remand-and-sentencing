import Page, { PageElement } from './page'

export default class SearchSentenceTypePage extends Page {
  constructor() {
    super('Search Sentence Type')
  }

  searchButton = (): PageElement => cy.get('[data-qa="search-button"]')
}
