import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'
import CourtCaseOverallCaseOutcomeAppliedAllPage from '../../pages/courtCaseOverallCaseOutcomeAppliedAllPage'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseOverallCaseOutcomeAppliedAllPage: CourtCaseOverallCaseOutcomeAppliedAllPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/case-outcome-applied-all')
    courtCaseOverallCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseOverallCaseOutcomeAppliedAllPage)
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseOverallCaseOutcomeAppliedAllPage.continueButton().click()
    courtCaseOverallCaseOutcomeAppliedAllPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select if the outcome is the same for all offences.')
  })

  it('caption should only be shown for add court case journey', () => {
    courtCaseOverallCaseOutcomeAppliedAllPage.captionText().trimTextContent().should('equal', 'Add hearing information')
  })
})
