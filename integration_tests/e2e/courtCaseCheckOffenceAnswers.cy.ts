import CourtCaseCheckOffenceAnswersPage from '../pages/courtCaseCheckOffenceAnswersPage'
import Page from '../pages/page'

context('Check Offence Answers page', () => {
  let courtCaseCheckOffenceAnswersPage: CourtCaseCheckOffenceAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/check-offence-answers')
    courtCaseCheckOffenceAnswersPage = Page.verifyOnPage(CourtCaseCheckOffenceAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCheckOffenceAnswersPage.button().should('contain.text', 'Save and continue')
  })
})
