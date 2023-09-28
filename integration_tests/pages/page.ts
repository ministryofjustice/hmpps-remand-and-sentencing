export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  button = (): PageElement => cy.get('.govuk-button')

  prisonerBanner = (): PageElement => cy.get('.dwf-header')

  input = (): PageElement => cy.get('.govuk-input')

  dayDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-day`)

  monthDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-month`)

  yearDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-year`)

  summaryList = (): PageElement => cy.get('.govuk-summary-list')
}
