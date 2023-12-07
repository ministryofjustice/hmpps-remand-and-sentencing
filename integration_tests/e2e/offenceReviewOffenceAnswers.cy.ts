import OffenceReviewOffencesPage from '../pages/offenceReviewOffencesPage'
import Page from '../pages/page'

context('Review Offences Page', () => {
  let offenceReviewOffencesPage: OffenceReviewOffencesPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/0/appearance/0/review-offences')
    offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
  })

  it('displays person details', () => {
    offenceReviewOffencesPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceReviewOffencesPage.button().should('contain.text', 'Continue')
  })
})
