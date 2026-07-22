import BreachTermLengthPage from '../../pages/BreachTermLengthPage'
import Page from '../../pages/page'

context('Add Term length of the breach Page', () => {
  let breachTermLengthPage: BreachTermLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-term-length')
    breachTermLengthPage = Page.verifyOnPage(BreachTermLengthPage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    breachTermLengthPage.continueButton().click()
    breachTermLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the term length of the breach')
  })

  it('submitting a decimal number results in an error', () => {
    breachTermLengthPage.yearsInput().type('1.5')
    breachTermLengthPage.continueButton().click()
    breachTermLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    breachTermLengthPage.yearsInput().type('0')
    breachTermLengthPage.monthsInput().type('0')
    breachTermLengthPage.continueButton().click()
    breachTermLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The term length of the breach cannot be 0')
  })
})
