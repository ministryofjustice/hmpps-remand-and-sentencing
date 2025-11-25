import CourtCaseWarrantTypePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'
import UploadSentencingCourtDocumentsPage from '../../pages/uploadSentencingCourtDocumentsPage'
import DocumentUploadPage from '../../pages/documentUpload'

context('Upload sentencing court document page', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadWarrant')
    cy.task('stubUploadDocument')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/upload-court-documents')
    Page.verifyOnPage(UploadSentencingCourtDocumentsPage)
  })

  it(`uploads a document and shows on the upload court documents page`, () => {
    cy.contains('Upload sentencing warrant').click()
    const documentUploadPage = Page.verifyOnPageTitle(DocumentUploadPage, 'sentencing warrant')
    documentUploadPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    documentUploadPage.continueButton().click()
    Page.verifyOnPage(UploadSentencingCourtDocumentsPage)
    cy.contains('testfile.doc')
  })
})
