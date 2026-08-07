import Page from '../../pages/page'
import UploadAppealOrderPage from '../../pages/UploadAppealOrderPage'

context('Upload Appeal order Page', () => {
  let uploadAppealOrderPage: UploadAppealOrderPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/upload-appeal-order')
    uploadAppealOrderPage = Page.verifyOnPage(UploadAppealOrderPage)
  })

  it('submitting without selecting anything results in an error', () => {
    uploadAppealOrderPage.continueButton().click()
    uploadAppealOrderPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select a document to upload.')
  })
})
