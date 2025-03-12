import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import Page from '../pages/page'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'

context('Add Court Case Sentence Length Page', () => {
  let courtCaseOverallSentenceLengthPage: CourtCaseOverallSentenceLengthPage
  let offenceConvictionDatePage: OffenceConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-sentence-length')
    courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
  })

  it('displays person details', () => {
    courtCaseOverallSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseOverallSentenceLengthPage.continueButton().should('contain.text', 'Save and continue')
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

  it('Navigating away from the page and coming back using the back-link retains the state of the page', () => {
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.yearsInput().type('2')
    courtCaseOverallSentenceLengthPage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(
      OffenceConvictionDatePage,
      'Is the conviction date the same for all offences on the warrant?',
    )
    offenceConvictionDatePage.backLink().click()
    courtCaseOverallSentenceLengthPage.radioSelector('true').should('be.checked')
    courtCaseOverallSentenceLengthPage.yearsInput().should('have.value', '2')
    courtCaseOverallSentenceLengthPage.radioLabelSelector('false').click()
    courtCaseOverallSentenceLengthPage.continueButton().click()
    offenceConvictionDatePage.backLink().click()
    courtCaseOverallSentenceLengthPage.radioSelector('false').should('be.checked')
  })

  it('Correct offences caption is displayed', () => {
    courtCaseOverallSentenceLengthPage.offencesCaption().should('have.text', 'Add offences')
  })
})
