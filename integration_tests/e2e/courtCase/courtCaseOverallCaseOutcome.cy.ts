import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseOverallCaseOutcomePage: CourtCaseOverallCaseOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
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

  it('after confirm and continue check answers this becomes uneditable', () => {
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-answers')
    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-case-outcome')
    courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.continueButton().click()
    courtCaseOverallCaseOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You cannot submit after confirming appearance information')
  })

  it('caption should only be shown for add court case journey', () => {
    courtCaseOverallCaseOutcomePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add appearance information')
  })
})
