import BreachTypePage from '../../pages/BreachTypePage'
import Page from '../../pages/page'
import UploadBreachOrderPage from '../../pages/UploadBreachOrderPage'

context('Upload Breach order Page', () => {
  let uploadBreachOrderPage: UploadBreachOrderPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-type')
    const breachTypePage = Page.verifyOnPage(BreachTypePage)
    breachTypePage.radioLabelSelector('BREACH_OF_SUPERVISION_REQUIREMENTS').click()
    breachTypePage.continueButton().click()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/upload-breach-order')
    uploadBreachOrderPage = Page.verifyOnPage(UploadBreachOrderPage)
  })

  it('submitting without selecting anything results in an error', () => {
    uploadBreachOrderPage.continueButton().click()
    uploadBreachOrderPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select a document to upload.')
  })
})
