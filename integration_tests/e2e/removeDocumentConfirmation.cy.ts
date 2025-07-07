import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import RemoveDocumentConfirmationPage from '../pages/removeDocumentConfirmationPage'
import UploadRemandCourtDocumentsPage from '../pages/uploadRemandCourtDocumentsPage'
import DocumentUploadPage from '../pages/documentUpload'

context('Remove document confirmation page', () => {
  let removeDocumentConfirmationPage: RemoveDocumentConfirmationPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadWarrant')
    cy.task('stubUploadDocument')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/upload-court-documents')
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    cy.contains('Upload remand warrant').click()
    const uploadDocumentPage = Page.verifyOnPageTitle(DocumentUploadPage, 'remand warrant')
    uploadDocumentPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadDocumentPage.continueButton().click()
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    cy.contains('Delete').click()
    removeDocumentConfirmationPage = Page.verifyOnPage(RemoveDocumentConfirmationPage)
  })

  it('displays person details', () => {
    removeDocumentConfirmationPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    removeDocumentConfirmationPage.continueButton().should('contain.text', 'Continue')
  })

  it('filename is displayed', () => {
    removeDocumentConfirmationPage.fileName.should('contain.text', 'testfile.doc')
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
