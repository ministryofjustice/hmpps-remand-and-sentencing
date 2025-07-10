import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import SentenceFirstSentenceConsecutiveToPage from '../pages/sentenceFirstSentenceConsecutiveToPage'

context('First sentence consecutive to Page', () => {
  let sentenceFirstSentenceConsecutiveToPage: SentenceFirstSentenceConsecutiveToPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetSentencesToChainTo')
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetOffencesByCodes', {})

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/0/first-sentence-consecutive-to',
    )
    sentenceFirstSentenceConsecutiveToPage = Page.verifyOnPage(SentenceFirstSentenceConsecutiveToPage)
  })

  it('displays person details', () => {
    sentenceFirstSentenceConsecutiveToPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    sentenceFirstSentenceConsecutiveToPage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    sentenceFirstSentenceConsecutiveToPage.continueButton().click()
    sentenceFirstSentenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select the sentence that this sentence is consecutive to')
  })
})
