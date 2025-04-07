import OffenceSentenceSelectCasePage from '../pages/offenceSentenceSelectCasePage'
import Page from '../pages/page'

context('Add Offence Sentence select case page', () => {
  let offenceSentenceSelectCasePage: OffenceSentenceSelectCasePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetSentencedCourtCases')
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-select-case')
    offenceSentenceSelectCasePage = Page.verifyOnPage(OffenceSentenceSelectCasePage)
  })

  it('displays person details', () => {
    offenceSentenceSelectCasePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceSelectCasePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    offenceSentenceSelectCasePage.continueButton().click()
    offenceSentenceSelectCasePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the case')
  })
})
