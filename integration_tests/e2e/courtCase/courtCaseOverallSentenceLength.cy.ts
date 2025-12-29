import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import Page from '../../pages/page'

context('Add Court Case Sentence Length Page', () => {
  let courtCaseOverallSentenceLengthPage: CourtCaseOverallSentenceLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-sentence-length')
    courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.continueButton().click()
    courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the overall sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.yearsInput().type('1.5')
    courtCaseOverallSentenceLengthPage.continueButton().click()
    courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.yearsInput().type('0')
    courtCaseOverallSentenceLengthPage.monthsInput().type('0')
    courtCaseOverallSentenceLengthPage.continueButton().click()
    courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })
})
