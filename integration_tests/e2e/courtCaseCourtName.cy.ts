import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import Page from '../pages/page'

context('Court Case Court Name Page', () => {
  let courtCaseCourtNamePage: CourtCaseCourtNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/court-name')
    courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCourtNamePage.button().should('contain.text', 'Continue')
  })
})
