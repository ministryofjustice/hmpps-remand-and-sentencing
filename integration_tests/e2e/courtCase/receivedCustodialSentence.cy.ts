import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'

context('Received custodial sentence page', () => {
  let receivedCustodialSentencePage: ReceivedCustodialSentencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
  })

  it('submitting without selecting anything results in error', () => {
    receivedCustodialSentencePage.continueButton().click()
    receivedCustodialSentencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select whether Cormac Meza received a custodial sentence')
  })
})
