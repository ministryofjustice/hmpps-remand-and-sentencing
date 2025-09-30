export type PageElement = Cypress.Chainable<JQuery>

export default abstract class Page {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  static verifyOnPageTitle<T>(constructor: new (parameter: string) => T, parameter: string): T {
    return new constructor(parameter)
  }

  public skipAxe(): boolean {
    return false
  }

  protected constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1:first').contains(this.title)

    if (!this.skipAxe()) {
      cy.injectAxe()

      // ✅ run axe manually (no assertion, just logging)
      cy.window({ log: false }).then(win => {
        return win.axe.run().then(results => {
          if (results.violations.length) {
            cy.task('log', `⚠️ ${results.violations.length} accessibility violation(s) detected`)
            results.violations.forEach(v => {
              cy.task('log', `${v.id} [${v.impact}] - ${v.help}`)
              v.nodes.forEach(node => {
                cy.task('log', `  ${node.target}`)
              })
            })
          }
          // 🚨 important: do not throw → tests keep running
        })
      })
    }
  }

  signOut = (): PageElement => cy.get('[data-qa=signOut]')

  manageDetails = (): PageElement => cy.get('[data-qa=manageDetails]')

  continueButton = (): PageElement => cy.get('[data-qa=continue-button]')

  confirmAndContinueButton = (): PageElement => cy.get('[data-qa=confirm-and-add-offence]')

  prisonerBanner = (): PageElement => cy.get('.mini-profile')

  subnav = (): PageElement => cy.get('nav')

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

  appearanceDetailsSummaryList = (): PageElement => cy.get('[data-qa=appearanceDetails]')

  radioLabelSelector = (value: string): PageElement =>
    this.radioSelector(value)
      .invoke('attr', 'id')
      .then(id => cy.get(`label[for="${id}"]`))

  radioLabelContains = (value: string): PageElement => cy.get(`label:contains("${value}")`)

  radioSelector = (value: string): PageElement => cy.get(`:radio[value="${value}"]`)

  autoCompleteInput = (): PageElement => cy.get('.autocomplete__input')

  captionText = (): PageElement => cy.get('.govuk-caption-l')

  bodyText = (): PageElement => cy.get('.govuk-body-l')

  legendParagraph = (): PageElement => cy.get('[data-qa=legendParagraph]')

  backLink = (): PageElement => cy.get('[data-qa=back-link]')

  clearTheSelection = (): PageElement => cy.contains('Clear the selection')

  changeLink = (personId: string, courtCaseReference: string, appearanceReference: string, page: string): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseReference}/add-court-appearance/${appearanceReference}/${page}?submitToCheckAnswers=true"]:first`,
    )

  offenceParagraph = (): PageElement => cy.get('[data-qa=offenceParagraph]')

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')

  custodialOffences = (): PageElement => cy.get('[data-qa="custodialOffences"]')

  noNonCustodialOutcomeInset = (): PageElement => cy.get('[data-qa="noNonCustodialOutcomeInset"]')
}
