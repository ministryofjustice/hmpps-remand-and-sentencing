import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseAlternativeSentenceLengthPage from '../../pages/courtCaseAlternativeSentenceLengthPage'
import Page from '../../pages/page'

context('Court Case Alternative Sentence Length Page', () => {
  let courtCaseAlternativeSentenceLengthPage: CourtCaseAlternativeSentenceLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/alternative-overall-sentence-length')
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseAlternativeSentenceLengthPage.continueButton().click()
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
    courtCaseAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the overall sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('first').type('2.5')
    courtCaseAlternativeSentenceLengthPage.continueButton().click()
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
    courtCaseAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('first').type('0')
    courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('second').type('0')
    courtCaseAlternativeSentenceLengthPage.continueButton().click()
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
    courtCaseAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })

  it('submitting more than 1 of the same time unit results in an error', () => {
    courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('first').type('2')
    courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('second').type('2')
    courtCaseAlternativeSentenceLengthPage.sentenceLengthDropDown('first').select('years')
    courtCaseAlternativeSentenceLengthPage.sentenceLengthDropDown('second').select('years')
    courtCaseAlternativeSentenceLengthPage.continueButton().click()
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
    courtCaseAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem More than one of the same period length unit is not allowed More than one of the same period length unit is not allowed',
      )
  })
})
