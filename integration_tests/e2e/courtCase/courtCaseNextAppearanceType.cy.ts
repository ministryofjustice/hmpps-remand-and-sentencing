import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'
import Page from '../../pages/page'

context('Next appearance type page', () => {
  let courtCaseNextAppearanceTypePage: CourtCaseNextAppearanceTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceTypes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-type')
    courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseNextAppearanceTypePage.continueButton().click()
    courtCaseNextAppearanceTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the next appearance type')
  })

  it('caption should only be shown for add next court appearance journey', () => {
    courtCaseNextAppearanceTypePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add next court appearance')
  })
})
