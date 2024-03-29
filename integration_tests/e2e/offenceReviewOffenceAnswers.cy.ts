import OffenceReviewOffencesPage from '../pages/offenceReviewOffencesPage'
import Page from '../pages/page'

context('Review Offences Page', () => {
  let offenceReviewOffencesPage: OffenceReviewOffencesPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance')
    cy.task('stubGetOffencesByCodes')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/12345/appearance/1/review-offences')
    offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
  })

  it('displays person details', () => {
    offenceReviewOffencesPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceReviewOffencesPage.button().should('contain.text', 'Continue')
  })
})
