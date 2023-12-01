import CourtCaseLookupCaseOutcomePage from '../pages/courtCaseLookupCaseOutcomePage'
import Page from '../pages/page'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseLookupCaseOutcomePage: CourtCaseLookupCaseOutcomePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/0/appearance/0/lookup-case-outcome')
    courtCaseLookupCaseOutcomePage = Page.verifyOnPage(CourtCaseLookupCaseOutcomePage)
  })

  it('displays person details', () => {
    courtCaseLookupCaseOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseLookupCaseOutcomePage.button().should('contain.text', 'Continue')
  })
})
