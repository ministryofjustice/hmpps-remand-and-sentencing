import CourtCaseNextAppearanceSetPage from '../../pages/courtCaseNextAppearanceSetPage'
import Page from '../../pages/page'

context('Next Appearance been set page', () => {
  let courtCaseNextAppearanceSetPage: CourtCaseNextAppearanceSetPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-select')
    courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseNextAppearanceSetPage.continueButton().click()
    courtCaseNextAppearanceSetPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the appearance has been set')
  })

  it('caption should only be shown for add next court appearance journey', () => {
    courtCaseNextAppearanceSetPage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add next court appearance')
  })
})
