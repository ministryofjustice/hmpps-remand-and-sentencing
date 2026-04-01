import Page, { PageElement } from './page'

export default class SelectOffenceWithAggravatedFactorsPage extends Page {
  constructor() {
    super('Select the offences with aggravating factors')
  }

  // The macro places the data-qa attribute directly on the input element
  aggravatedOffenceCheckbox = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCheckbox-${index}]`)

  // In the new Nunjucks file, we have specific divs for Count and FirstLine
  aggravatedOffenceFirstLine = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceFirstLine-${index}]`)

  aggravatedOffenceCount = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCount-${index}]`)

  // Returns all elements that represent the "First Line" or "Count" for mapping
  // Note: We use a comma to select either the Count div OR the FirstLine div
  allAggravatedOffenceIdentifiers = (): PageElement =>
    cy.get('[data-qa^="aggravatedOffenceFirstLine-"], [data-qa^="aggravatedOffenceCount-"]')

  // Extracts numeric Count values from the rendered list
  getAggravatedOffenceCounts = (): Cypress.Chainable<number[]> =>
    cy.get('[data-qa^="aggravatedOffenceCount-"]').then($els => {
      const counts: number[] = Array.from($els)
        .map(el => {
          const text = el.textContent.trim()
          const m = text.match(/Count\s+(\d+)/)
          return m ? parseInt(m[1], 10) : null
        })
        .filter((c): c is number => c !== null)

      return counts
    })
}
