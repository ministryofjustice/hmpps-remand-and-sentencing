import Page, { PageElement } from './page'

export default class AggravatingFactorsSelectOffenceWithAggravatedFactorsPage extends Page {
  constructor() {
    super('Select the offences with aggravating factors')
  }

  // Returns the checkbox input element for the given index (0-based)
  aggravatedOffenceCheckbox = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCheckbox-${index}]`)

  getAggravatedOffenceCounts = (): Cypress.Chainable<number[]> =>
    this.aggravatedOffenceCheckboxes().then($checkboxes => {
      const counts: (number | null)[] = Array.from($checkboxes).map(cb => {
        const container = (cb as HTMLElement).closest('label') || (cb as HTMLElement).parentElement
        if (!container) return null

        const countEl = container.querySelector('[data-qa^="aggravatedOffenceCount-"]')
        if (countEl) {
          const m = countEl.textContent?.trim().match(/Count\s+(\d+)/)
          return m ? parseInt(m[1], 10) : null
        }
        return null
      })
      return counts.filter((c): c is number => c !== null)
    })

  // Returns all checkbox elements for offences
  aggravatedOffenceCheckboxes = (): PageElement => cy.get('[data-qa^="aggravatedOffenceCheckbox-"]')

  // Assert there are exactly `expected` checkbox options
  assertAggravatedOffenceCheckboxesCount = (expected: number): Cypress.Chainable<JQuery<HTMLElement>> =>
    this.aggravatedOffenceCheckboxes().should('have.length', expected)
}
