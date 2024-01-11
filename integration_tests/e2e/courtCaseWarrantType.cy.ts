import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'

context('Warrant type page', () => {
  let courtCaseWarrantTypePage: CourtCaseWarrantTypePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
  })

  it('displays person details', () => {
    courtCaseWarrantTypePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantTypePage.button().should('contain.text', 'Continue')
  })
})
