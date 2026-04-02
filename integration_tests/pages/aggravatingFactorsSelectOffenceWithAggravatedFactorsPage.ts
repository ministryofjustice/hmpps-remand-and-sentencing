import Page, { PageElement } from './page'

export default class AggravatingFactorsSelectOffenceWithAggravatedFactorsPage extends Page {
  constructor() {
    super('Select the offences with aggravating factors')
  }

  // Returns the checkbox input element for the given index (0-based)
  aggravatedOffenceCheckbox = (index: number): PageElement => cy.get(`[data-qa=aggravatedOffenceCheckbox-${index}]`)

  // Returns all first-line elements (for mapping/order assertions)
  // Extracts numeric Count values from the rendered list by inspecting the
  // rendered checkbox item. This is robust to whether the template renders a
  // `aggravatedOffenceCount-<i>` div or an `aggravatedOffenceFirstLine-<i>` div.
  getAggravatedOffenceCounts = (): Cypress.Chainable<number[]> =>
    this.aggravatedOffenceCheckboxes().then($checkboxes => {
      const counts: number[] = Array.from($checkboxes).map(cb => {
        // The GOV.UK macro renders the input inside a label; find the closest
        // ancestor that contains our data-qa markers and look for a count div.
        const container = (cb as HTMLElement).closest('label') || (cb as HTMLElement).parentElement
        if (!container) return null

        const countEl = container.querySelector('[data-qa^="aggravatedOffenceCount-"]')
        if (countEl) {
          const m = countEl.textContent?.trim().match(/Count\s+(\d+)/)
          return m ? parseInt(m[1], 10) : null
        }

        // Fallback: sometimes the first-line element contains the offence
        // description (no explicit Count div). In that case we treat it as
        // having no numeric count and filter it out.
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
