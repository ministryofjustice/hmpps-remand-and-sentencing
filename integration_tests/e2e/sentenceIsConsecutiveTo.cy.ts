import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import SentenceIsSentenceConsecutiveToPage from '../pages/sentenceIsSentenceConsecutiveToPage'

context('Is sentence consecutive to Page', () => {
  let sentenceIsSentenceConsecutiveToPage: SentenceIsSentenceConsecutiveToPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/0/is-sentence-consecutive-to')
    sentenceIsSentenceConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
  })

  it('displays person details', () => {
    sentenceIsSentenceConsecutiveToPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    sentenceIsSentenceConsecutiveToPage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    sentenceIsSentenceConsecutiveToPage.continueButton().click()
    sentenceIsSentenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select Yes if the sentence is consecutive to a sentence on another case')
  })
})
