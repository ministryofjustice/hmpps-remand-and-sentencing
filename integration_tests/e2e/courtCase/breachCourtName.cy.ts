import BreachCourtNamePage from '../../pages/BreachCourtNamePage'
import Page from '../../pages/page'

context('Breach court name page', () => {
  let breachCourtNamePage: BreachCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-court')
    breachCourtNamePage = Page.verifyOnPage(BreachCourtNamePage)
  })

  it('submitting without entering anything in the input results in an error', () => {
    breachCourtNamePage.continueButton().click()
    breachCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the court that heard the breach')
  })
})
