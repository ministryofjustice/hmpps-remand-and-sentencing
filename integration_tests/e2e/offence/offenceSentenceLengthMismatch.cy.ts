import Page from '../../pages/page'
import OffenceSentenceLengthMismatchPage from '../../pages/offenceSentenceLengthMismatchPage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'

context('Offence sentence length mismatch', () => {
  let offenceSentenceLengthMismatchPage: OffenceSentenceLengthMismatchPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/sentence-length-mismatch')
    offenceSentenceLengthMismatchPage = Page.verifyOnPage(OffenceSentenceLengthMismatchPage)
  })

  it('clicking continue goes back to task list page', () => {
    offenceSentenceLengthMismatchPage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
  })
})
