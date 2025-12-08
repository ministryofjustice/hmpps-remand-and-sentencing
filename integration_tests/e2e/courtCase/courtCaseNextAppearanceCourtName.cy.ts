import CourtCaseNextAppearanceCourtNamePage from '../../pages/courtCaseNextAppearanceCourtNamePage'
import Page from '../../pages/page'

context('Next appearance court name page', () => {
  let courtCaseNextAppearanceCourtNamePage: CourtCaseNextAppearanceCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-court-name')
    courtCaseNextAppearanceCourtNamePage = Page.verifyOnPage(CourtCaseNextAppearanceCourtNamePage)
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseNextAppearanceCourtNamePage.continueButton().click()
    courtCaseNextAppearanceCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the court name')
  })

  it('caption should only be shown for add next court appearance journey', () => {
    courtCaseNextAppearanceCourtNamePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add next court appearance')
  })
})
