import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import Page from '../../pages/page'
import UploadRemandCourtDocumentsPage from '../../pages/uploadRemandCourtDocumentsPage'
import DocumentUploadPage from '../../pages/documentUpload'

context('Upload remand court document page', () => {
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
  })

  it(`uploads a document and shows on the upload court documents page`, () => {
    cy.contains('Upload remand warrant').click()
    const documentUploadPage = Page.verifyOnPageTitle(DocumentUploadPage, 'remand warrant')
    documentUploadPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    documentUploadPage.continueButton().click()
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    cy.contains('testfile.doc')
  })
})
