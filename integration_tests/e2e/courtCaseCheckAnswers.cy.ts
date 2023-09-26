import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import Page from '../pages/page'

context('Court Case Check Answers Page', () => {
  let courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/check-answers')
    courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to Save court case is displayed', () => {
    courtCaseCheckAnswersPage.button().should('contain.text', 'Save court case')
  })
})
