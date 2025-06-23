import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import UploadRemandCourtDocumentsPage from '../pages/uploadRemandCourtDocumentsPage'

context('Upload remand court document page', () => {
  let uploadRemandCourtDocumentsPage: UploadRemandCourtDocumentsPage
  beforeEach(() => {
    cy.task('happyPathStubs')

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
})
