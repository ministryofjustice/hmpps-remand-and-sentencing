import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import Page from '../pages/page'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseOverallCaseOutcomePage: CourtCaseOverallCaseOutcomePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/overall-case-outcome')
    courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
  })

  it('displays person details', () => {
    courtCaseOverallCaseOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseOverallCaseOutcomePage.button().should('contain.text', 'Continue')
  })
})
