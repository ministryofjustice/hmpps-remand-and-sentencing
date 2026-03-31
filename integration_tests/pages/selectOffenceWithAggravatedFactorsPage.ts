import Page, { PageElement } from './page'

export default class SelectOffenceWithAggravatedFactorsPage extends Page {
  constructor() {
    super('Select the offences with aggravating factors')
  }

  // Returns the checkbox input element for the given index (0-based)
  aggravatedOffenceCheckbox = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCheckbox-${index}]`)

  // Returns the first line container (which contains the Count or the offence code) for the given index
  aggravatedOffenceFirstLine = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceFirstLine-${index}]`)

  // Returns the Count element for the given index (if present)
  aggravatedOffenceCount = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCount-${index}]`)

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
}
