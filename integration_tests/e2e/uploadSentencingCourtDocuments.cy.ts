import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import UploadSentencingCourtDocumentsPage from '../pages/uploadSentencingCourtDocumentsPage'
import DocumentUploadPage from '../pages/documentUpload'

context('Upload sentencing court document page', () => {
  let uploadSentencingCourtDocumentsPage: UploadSentencingCourtDocumentsPage
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
    uploadSentencingCourtDocumentsPage = Page.verifyOnPage(UploadSentencingCourtDocumentsPage)
  })

  it('displays person details', () => {
    uploadSentencingCourtDocumentsPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    uploadSentencingCourtDocumentsPage.continueButton().should('contain.text', 'Continue')
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
