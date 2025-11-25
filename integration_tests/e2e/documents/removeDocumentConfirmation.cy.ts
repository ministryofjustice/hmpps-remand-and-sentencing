import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'
import RemoveDocumentConfirmationPage from '../../pages/removeDocumentConfirmationPage'
import UploadRemandCourtDocumentsPage from '../../pages/uploadRemandCourtDocumentsPage'
import DocumentUploadPage from '../../pages/documentUpload'

context('Remove document confirmation page', () => {
  let removeDocumentConfirmationPage: RemoveDocumentConfirmationPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadWarrant')
    cy.task('stubUploadDocument')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/upload-court-documents')
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    cy.contains('Upload remand warrant').click()
    const uploadDocumentPage = Page.verifyOnPageTitle(DocumentUploadPage, 'remand warrant')
    uploadDocumentPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadDocumentPage.continueButton().click()
    const uploadRemandCourtDocumentsPage = Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    uploadRemandCourtDocumentsPage.removeDocumentLink('HMCTS_WARRANT').click()
    removeDocumentConfirmationPage = Page.verifyOnPage(RemoveDocumentConfirmationPage)
  })

  it('submitting without selecting anything results in error', () => {
    removeDocumentConfirmationPage.continueButton().click()
    removeDocumentConfirmationPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select an option.')
  })

  it('after confirm and continue the upload court documents page should come  ', () => {
    removeDocumentConfirmationPage.radioLabelSelector('false').click()
    removeDocumentConfirmationPage.continueButton().click()
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
  })
})
