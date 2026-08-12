import BreachTypePage from '../../pages/BreachTypePage'
import Page from '../../pages/page'

context('Breach type Page', () => {
  let breachTypePage: BreachTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-type')
    breachTypePage = Page.verifyOnPage(BreachTypePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    breachTypePage.continueButton().click()
    breachTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the type of breach')
  })
})
