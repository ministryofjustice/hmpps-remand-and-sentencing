import Page, { PageElement } from './page'

export default class AggravatingFactorsSelectOffenceWithAggravatedFactorsPage extends Page {
  constructor() {
    super('Select the offences with aggravating factors')
  }

  // Returns the checkbox input element for the given index (0-based)
  aggravatedOffenceCheckbox = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCheckbox-${index}]`)

  // Returns all first-line elements (for mapping/order assertions)
  allAggravatedOffenceFirstLines = (): PageElement => cy.get('[data-qa^="aggravatedOffenceFirstLine-"]')

  // Extracts numeric Count values from the rendered list (filters out non-count items)
  getAggravatedOffenceCounts = (): Cypress.Chainable<number[]> =>
    this.allAggravatedOffenceFirstLines().then($els => {
      const counts: number[] = Array.from($els)
        .map(el => {
          const countEl = el.querySelector('[data-qa^="aggravatedOffenceCount-"]')
          if (countEl) {
            const m = countEl.textContent.trim().match(/Count\s+(\d+)/)
            return m ? parseInt(m[1], 10) : null
          }
          return null
        })
        .filter((c): c is number => c !== null)

      return counts
    })

  // Returns all checkbox elements for offences
  aggravatedOffenceCheckboxes = (): PageElement => cy.get('[data-qa^="aggravatedOffenceCheckbox-"]')

  // Assert there are exactly `expected` checkbox options
  assertAggravatedOffenceCheckboxesCount = (expected: number): Cypress.Chainable<JQuery<HTMLElement>> =>
    this.aggravatedOffenceCheckboxes().should('have.length', expected)
}
