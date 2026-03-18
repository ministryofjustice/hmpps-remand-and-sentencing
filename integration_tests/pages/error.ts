import Page from './page'

export default class ErrorPage extends Page {
  constructor(errorTitle: string) {
    super(errorTitle)
  }

  courtCasesLink = (): Cypress.Chainable => cy.contains('a', 'court cases')
}
