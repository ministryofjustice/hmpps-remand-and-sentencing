import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import Page from '../pages/page'

context('Court Case Court Name Page', () => {
  let courtCaseCourtNamePage: CourtCaseCourtNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/court-name')
    courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCourtNamePage.button().should('contain.text', 'Continue')
  })
})
