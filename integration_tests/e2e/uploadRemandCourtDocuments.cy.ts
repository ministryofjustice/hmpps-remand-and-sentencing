import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import UploadRemandCourtDocumentsPage from '../pages/uploadRemandCourtDocumentsPage'
import DocumentUploadPage from '../pages/documentUpload'

context('Upload remand court document page', () => {
  let uploadRemandCourtDocumentsPage: UploadRemandCourtDocumentsPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadWarrant')
    cy.task('stubDownloadFile')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/upload-court-documents')
    uploadRemandCourtDocumentsPage = Page.verifyOnPage(UploadRemandCourtDocumentsPage)
  })

  it('displays person details', () => {
    uploadRemandCourtDocumentsPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    uploadRemandCourtDocumentsPage.continueButton().should('contain.text', 'Continue')
  })

  it(`downloads a document and stays on the upload court documents page`, () => {
    cy.contains('Upload remand warrant').click()
    const documentUploadPage = Page.verifyOnPageTitle(DocumentUploadPage, 'remand warrant')
    documentUploadPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    documentUploadPage.continueButton().click()
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    cy.contains('testfile.doc').click()
    Page.verifyOnPage(UploadRemandCourtDocumentsPage)
  })
})
