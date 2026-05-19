import Page from '../../pages/page'
import UploadAppealOrderPage from '../../pages/UploadAppealOrderPage'
import ViewAppealOrderPage from '../../pages/ViewAppealOrderPage'
import AppealDeleteDocumentPage from '../../pages/AppealDeleteDocumentPage'

context('Remove document confirmation page', () => {
  let appealDeleteDocumentPage: AppealDeleteDocumentPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadTempDocument', {
      type: 'APPEAL_ORDER',
    })
    cy.task('stubUploadDocument')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/upload-appeal-order')
    const uploadAppealOrderPage = Page.verifyOnPage(UploadAppealOrderPage)
    uploadAppealOrderPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadAppealOrderPage.continueButton().click()
    cy.location('pathname').should('include', '/view-appeal-order')
    const viewAppealOrderPage = Page.verifyOnPage(ViewAppealOrderPage)
    viewAppealOrderPage.removeDocumentLink('APPEAL_ORDER').click()
    appealDeleteDocumentPage = Page.verifyOnPage(AppealDeleteDocumentPage)
  })

  it('submitting without selecting anything results in error', () => {
    appealDeleteDocumentPage.continueButton().click()
    appealDeleteDocumentPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select an option.')
  })

  it('after confirm and continue the upload appeal order page should appear', () => {
    appealDeleteDocumentPage.radioLabelSelector('true').click()
    appealDeleteDocumentPage.continueButton().click()
    Page.verifyOnPage(UploadAppealOrderPage)
  })
})
