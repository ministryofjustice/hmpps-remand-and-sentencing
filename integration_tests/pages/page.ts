export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  static verifyOnPageTitle<T>(constructor: new (parameter: string) => T, parameter: string): T {
    return new constructor(parameter)
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

  prisonerBanner = (): PageElement => cy.get('.mini-profile')

  input = (): PageElement => cy.get('.govuk-input')

  checkboxLabelSelector = (value: string): PageElement =>
    cy
      .get(`:checkbox[value="${value}"]`)
      .invoke('attr', 'id')
      .then(id => cy.get(`label[for="${id}"]`))

  errorSummary = (): PageElement => cy.get('.govuk-error-summary')

  dayDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-day`)

  monthDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-month`)

  yearDateInput = (idPrefix: string): PageElement => cy.get(`#${idPrefix}-year`)

  summaryList = (): PageElement => cy.get('.govuk-summary-list')

  radioLabelSelector = (value: string): PageElement =>
    cy
      .get(`:radio[value="${value}"]`)
      .invoke('attr', 'id')
      .then(id => cy.get(`label[for="${id}"]`))

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')
}
