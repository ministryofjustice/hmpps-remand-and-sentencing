import CourtCaseNextCourtDateQuestionPage from '../pages/courtCaseNextCourtDateQuestionPage'
import Page from '../pages/page'

context('Court Case Next Court Date Question Page', () => {
  let courtCaseNextCourtDateQuestionPage: CourtCaseNextCourtDateQuestionPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/next-court-date-question')
    courtCaseNextCourtDateQuestionPage = Page.verifyOnPage(CourtCaseNextCourtDateQuestionPage)
  })

  it('displays person details', () => {
    courtCaseNextCourtDateQuestionPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextCourtDateQuestionPage.button().should('contain.text', 'Continue')
  })
})
