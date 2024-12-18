import CourtCaseNextHearingCourtNamePage from '../pages/courtCaseNextHearingCourtNamePage'
import Page from '../pages/page'

context('Next hearing court name page', () => {
  let courtCaseNextHearingCourtNamePage: CourtCaseNextHearingCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-court-name')
    courtCaseNextHearingCourtNamePage = Page.verifyOnPage(CourtCaseNextHearingCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingCourtNamePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseNextHearingCourtNamePage.continueButton().click()
    courtCaseNextHearingCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the court name')
  })
})
