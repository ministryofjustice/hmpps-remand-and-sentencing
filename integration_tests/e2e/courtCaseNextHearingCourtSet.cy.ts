import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingCourtSetPage: CourtCaseNextHearingCourtSetPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-court-select')
    courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingCourtSetPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingCourtSetPage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in error', () => {
    courtCaseNextHearingCourtSetPage.continueButton().click()
    courtCaseNextHearingCourtSetPage
      .errorSummary()
      .trimTextContent()
      .should('equal', "There is a problem Select 'Yes' if the next hearing will be at this same court.")
  })
})
