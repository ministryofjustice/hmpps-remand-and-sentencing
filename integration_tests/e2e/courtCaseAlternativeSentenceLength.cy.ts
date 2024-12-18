import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseAlternativeSentenceLengthPage from '../pages/courtCaseAlternativeSentenceLengthPage'
import Page from '../pages/page'

context('Court Case Alternative Sentence Length Page', () => {
  let courtCaseAlternativeSentenceLengthPage: CourtCaseAlternativeSentenceLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/alternative-overall-sentence-length')
    courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
  })

  it('displays person details', () => {
    courtCaseAlternativeSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseAlternativeSentenceLengthPage.continueButton().should('contain.text', 'Continue')
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
})
