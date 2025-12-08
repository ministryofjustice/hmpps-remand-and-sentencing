import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseNextAppearanceCourtSetPage from '../../pages/courtCaseNextAppearanceCourtSetPage'
import Page from '../../pages/page'

context('Next appearance been set page', () => {
  let courtCaseNextAppearanceCourtSetPage: CourtCaseNextAppearanceCourtSetPage
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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-court-select')
    courtCaseNextAppearanceCourtSetPage = Page.verifyOnPage(CourtCaseNextAppearanceCourtSetPage)
  })

  it('submitting without selecting anything results in error', () => {
    courtCaseNextAppearanceCourtSetPage.continueButton().click()
    courtCaseNextAppearanceCourtSetPage
      .errorSummary()
      .trimTextContent()
      .should('equal', "There is a problem Select 'Yes' if the next appearance will be at this same court.")
  })
})
