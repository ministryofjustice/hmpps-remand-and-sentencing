import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceAlternativeSentenceLengthPage from '../pages/offenceAlternativeSentenceLengthPage'
import Page from '../pages/page'

context('Add Offence Alternative Sentence Length Page', () => {
  let offenceAlternativeSentenceLengthPage: OffenceAlternativeSentenceLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/alternative-sentence-length')
    offenceAlternativeSentenceLengthPage = Page.verifyOnPage(OffenceAlternativeSentenceLengthPage)
  })

  it('displays person details', () => {
    offenceAlternativeSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceAlternativeSentenceLengthPage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceAlternativeSentenceLengthPage.button().click()
    offenceAlternativeSentenceLengthPage = Page.verifyOnPage(OffenceAlternativeSentenceLengthPage)
    offenceAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    offenceAlternativeSentenceLengthPage.sentenceLengthInput('first').type('2.5')
    offenceAlternativeSentenceLengthPage.button().click()
    offenceAlternativeSentenceLengthPage = Page.verifyOnPage(OffenceAlternativeSentenceLengthPage)
    offenceAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    offenceAlternativeSentenceLengthPage.sentenceLengthInput('first').type('0')
    offenceAlternativeSentenceLengthPage.sentenceLengthInput('second').type('0')
    offenceAlternativeSentenceLengthPage.button().click()
    offenceAlternativeSentenceLengthPage = Page.verifyOnPage(OffenceAlternativeSentenceLengthPage)
    offenceAlternativeSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })
})
