import Page, { PageElement } from './page'

export default class AggravatingFactorsCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  finishAddingButton = (): PageElement => cy.get('[data-qa="finishAddingButton"]')

  finishedAddingRadio = (): PageElement => cy.get('[data-qa="finishAddingRadio"]')

  insetText = (): PageElement => cy.get('[data-qa="aggravatedFactorsInsetText"]')

  selectAnotherAggravatingFactor = (): PageElement => cy.get('[data-qa="selectAnotherAggravatingFactor"]')
}
