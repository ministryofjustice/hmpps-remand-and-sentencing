import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import Page from '../pages/page'

context('Court Case Court Name Page', () => {
  let courtCaseCourtNamePage: CourtCaseCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
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

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseCourtNamePage.button().click()
    courtCaseCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the court name')
  })
})
