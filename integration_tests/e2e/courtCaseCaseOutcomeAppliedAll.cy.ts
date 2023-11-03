import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import Page from '../pages/page'

context('Court Case Case Outcome applied all Page', () => {
  let courtCaseCaseOutcomeAppliedAllPage: CourtCaseCaseOutcomeAppliedAllPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/case-outcome-applied-all')
    courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
  })

  it('displays person details', () => {
    courtCaseCaseOutcomeAppliedAllPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCaseOutcomeAppliedAllPage.button().should('contain.text', 'Continue')
  })
})
