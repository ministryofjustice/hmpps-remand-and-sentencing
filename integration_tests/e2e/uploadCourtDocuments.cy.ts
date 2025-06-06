import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import UploadCourtDocumentsPage from '../pages/uploadCourtDocumentsPage'

context('Upload court document page', () => {
  let uploadCourtDocumentsPage: UploadCourtDocumentsPage
  beforeEach(() => {
    cy.task('happyPathStubs')

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/upload-court-documents')
    uploadCourtDocumentsPage = Page.verifyOnPage(UploadCourtDocumentsPage)
  })

  it('displays person details', () => {
    uploadCourtDocumentsPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    uploadCourtDocumentsPage.continueButton().should('contain.text', 'Continue')
  })
})
