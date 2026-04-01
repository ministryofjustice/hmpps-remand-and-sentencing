import Page, { PageElement } from './page'

export default class SelectWhichAggravatingFactorsApplyPage extends Page {
  constructor() {
    super('Select which aggravating factors apply')
  }

  terrorRelatedCheckbox = (): PageElement => cy.get(`[data-qa=terrorRelatedCheckbox]`)

  foreignPowerRelatedCheckbox = (): PageElement => cy.get(`[data-qa=foreignPowerRelatedCheckbox]`)
}
