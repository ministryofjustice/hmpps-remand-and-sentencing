import Page from '../pages/page'
import OffenceFineAmountPage from '../pages/offenceFineAmountPage'

context('Add Offence Fine amount Page', () => {
  let offenceFineAmountPage: OffenceFineAmountPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/fine-amount')
    offenceFineAmountPage = Page.verifyOnPage(OffenceFineAmountPage)
  })

  it('displays person details', () => {
    offenceFineAmountPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceFineAmountPage.continueButton().should('contain.text', 'Continue')
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
