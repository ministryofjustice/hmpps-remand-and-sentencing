import Page, { PageElement } from './page'

export default class CannotChangeSentenceOutcomePage extends Page {
  constructor() {
    super('You cannot change the outcome for this sentence')
  }

  appearanceDetails = (): PageElement => cy.get('[data-qa="appearanceDetails"]')
}
