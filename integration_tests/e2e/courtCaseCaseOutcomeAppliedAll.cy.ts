import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import Page from '../pages/page'

context('Court Case Case Outcome applied all Page', () => {
  let courtCaseCaseOutcomeAppliedAllPage: CourtCaseCaseOutcomeAppliedAllPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/case-outcome-applied-all')
    courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
  })

  it('displays person details', () => {
    courtCaseCaseOutcomeAppliedAllPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCaseOutcomeAppliedAllPage.button().should('contain.text', 'Continue')
  })
})
