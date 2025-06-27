import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import DocumentUploadPage from '../pages/documentUpload'
import UploadSentencingCourtDocumentsPage from '../pages/uploadSentencingCourtDocumentsPage'

context('document upload page', () => {
  let documentUploadPage: DocumentUploadPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadWarrant')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant/upload-documents')
    documentUploadPage = Page.verifyOnPageTitle(DocumentUploadPage, 'sentencing warrant')
  })

  it('displays person details', () => {
    documentUploadPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    documentUploadPage.continueButton().should('contain.text', 'Continue')
  })

  it('shows an error when no document is uploaded and continue is clicked', () => {
    documentUploadPage.continueButton().click()
    documentUploadPage.errorSummary().should('contain.text', 'Select a document to upload.')
  })

  it(`uploads a document and redirects to the upload court documents page`, () => {
    documentUploadPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    documentUploadPage.continueButton().click()
    Page.verifyOnPage(UploadSentencingCourtDocumentsPage)
    cy.contains('testfile.doc')
  })
})
