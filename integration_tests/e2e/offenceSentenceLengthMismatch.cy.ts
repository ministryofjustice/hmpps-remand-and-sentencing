import Page from '../pages/page'
import OffenceSentenceLengthMismatchPage from '../pages/offenceSentenceLengthMismatchPage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'

context('Offence sentence length mismatch', () => {
  let offenceSentenceLengthMismatchPage: OffenceSentenceLengthMismatchPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/sentence-length-mismatch')
    offenceSentenceLengthMismatchPage = Page.verifyOnPage(OffenceSentenceLengthMismatchPage)
  })

  it('displays person details', () => {
    offenceSentenceLengthMismatchPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceLengthMismatchPage.button().should('contain.text', 'Continue')
  })

  it('submiting without selecting answer', () => {
    offenceSentenceLengthMismatchPage.button().click()
    offenceSentenceLengthMismatchPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select whether you want to continue.')
  })

  it('submitting selecting yes', () => {
    offenceSentenceLengthMismatchPage.radioLabelSelector('yes').click()
    offenceSentenceLengthMismatchPage.button().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
  })

  it('submitting selecting no', () => {
    offenceSentenceLengthMismatchPage.radioLabelSelector('no').click()
    offenceSentenceLengthMismatchPage.button().click()
    Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, '')
  })
})
