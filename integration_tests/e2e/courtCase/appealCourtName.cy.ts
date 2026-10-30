import AppealCourtNamePage from '../../pages/AppealCourtNamePage'
import Page from '../../pages/page'

context('Appeal court name page', () => {
  let appealCourtNamePage: AppealCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/appeal-court')
    appealCourtNamePage = Page.verifyOnPage(AppealCourtNamePage)
  })

  it('submitting without entering anything in the input results in an error', () => {
    appealCourtNamePage.continueButton().click()
    appealCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the court that heard the appeal')
  })
})
