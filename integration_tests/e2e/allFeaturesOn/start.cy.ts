import StartPage from '../../pages/startPage'
import Page from '../../pages/page'

// TODO: once appeals is switched on merge the context into integration_tests/e2e/other/start.cy.ts
context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetConsecutiveToDetails', {})
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  it('displays appeal court case summary', () => {
    startPage.courtCaseSummaryList('fa078b3d-7c29-4f61-8120-b40b16ed9633').getSummaryList().should('deep.equal', {
      'Case references': 'C894623',
      'First day in custody': '05/06/2025',
      'Overall case outcome': 'Sentence varied',
    })
  })
})
