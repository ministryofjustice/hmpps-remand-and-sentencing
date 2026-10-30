import AppealOverallCaseOutcomePage from '../../pages/AppealOverallCaseOutcomePage'
import Page from '../../pages/page'

context('Appeal Overall Case Outcome Page', () => {
  let appealOverallCaseOutcomePage: AppealOverallCaseOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/overall-case-outcome')
    appealOverallCaseOutcomePage = Page.verifyOnPage(AppealOverallCaseOutcomePage)
  })

  it('submitting without selecting anything results in an error', () => {
    appealOverallCaseOutcomePage.continueButton().click()
    appealOverallCaseOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the overall case outcome')
  })
})
