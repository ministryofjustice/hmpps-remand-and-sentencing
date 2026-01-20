import Page from '../../pages/page'
import OffenceFineAmountPage from '../../pages/offenceFineAmountPage'

context('Unknown recall sentence fine amount', () => {
  let offenceFineAmountPage: OffenceFineAmountPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetUnknownRecallSentenceAppearanceDetails')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/load-charge',
    )
    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/fine-amount',
    )
    offenceFineAmountPage = Page.verifyOnPage(OffenceFineAmountPage)
  })

  it('cancel button should not be visible', () => {
    offenceFineAmountPage.cancelButton().should('not.exist')
  })

  it("submitting a fine amount that isn't a number", () => {
    offenceFineAmountPage.input().type('bazinga')
    offenceFineAmountPage.continueButton().click()
    offenceFineAmountPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The fine amount must be entered in a valid format, such as £21.34')
  })
  it('submitting without entering a fine amount', () => {
    offenceFineAmountPage.continueButton().click()
    offenceFineAmountPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must provide the fine amount')
  })
})
