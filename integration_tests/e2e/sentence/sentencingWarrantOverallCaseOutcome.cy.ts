import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'

context('Sentencing Warrant Overall Case Outcome Page', () => {
  let courtCaseOverallCaseOutcomePage: CourtCaseOverallCaseOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-case-outcome')
    courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseOverallCaseOutcomePage.continueButton().click()
    courtCaseOverallCaseOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the overall case outcome')
  })
})
