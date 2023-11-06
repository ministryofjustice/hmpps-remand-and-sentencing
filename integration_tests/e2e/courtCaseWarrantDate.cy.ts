import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'

context('Court Case Warrant Date Page', () => {
  let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/warrant-date')
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
  })

  it('displays person details', () => {
    courtCaseWarrantDatePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantDatePage.button().should('contain.text', 'Continue')
  })
})
