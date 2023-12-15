import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import Page from '../pages/page'

context('Select court name page', () => {
  let courtCaseSelectCourtNamePage: CourtCaseSelectCourtNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/1/select-court-name')
    courtCaseSelectCourtNamePage = Page.verifyOnPage(CourtCaseSelectCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseSelectCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseSelectCourtNamePage.button().should('contain.text', 'Continue')
  })
})
