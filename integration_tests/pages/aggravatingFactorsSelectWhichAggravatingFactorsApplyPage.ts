import Page, { PageElement } from './page'

export default class AggravatingFactorsSelectWhichAggravatedFactorsApplyPage extends Page {
  constructor() {
    super('Select which aggravating factors apply')
  }

  checkboxByValue(value: string) {
    return cy.get(`input[name="aggravatedFactors"][value="${value}"]`)
  }
}
