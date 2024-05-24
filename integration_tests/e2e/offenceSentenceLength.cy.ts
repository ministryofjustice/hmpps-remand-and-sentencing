import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceSentenceLengthPage from '../pages/offenceSentenceLengthPage'
import Page from '../pages/page'

context('Add Offence Sentence Length Page', () => {
  let offenceSentenceLengthPage: OffenceSentenceLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/sentence-length')
    offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
  })

  it('displays person details', () => {
    offenceSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceLengthPage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceSentenceLengthPage.button().click()
    offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    offenceSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    offenceSentenceLengthPage.yearsInput().type('1.5')
    offenceSentenceLengthPage.button().click()
    offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    offenceSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    offenceSentenceLengthPage.yearsInput().type('0')
    offenceSentenceLengthPage.monthsInput().type('0')
    offenceSentenceLengthPage.button().click()
    offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    offenceSentenceLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })
})
