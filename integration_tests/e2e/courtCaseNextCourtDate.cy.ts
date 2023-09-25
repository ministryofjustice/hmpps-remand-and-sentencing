import CourtCaseNextCourtDatePage from '../pages/courtCaseNextCourtDatePage'
import Page from '../pages/page'

context('Court Case Next Court Date Page', () => {
  let courtCaseNextCourtDatePage: CourtCaseNextCourtDatePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/next-court-date')
    courtCaseNextCourtDatePage = Page.verifyOnPage(CourtCaseNextCourtDatePage)
  })

  it('displays person details', () => {
    courtCaseNextCourtDatePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextCourtDatePage.button().should('contain.text', 'Continue')
  })
})
