import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'
import UploadCourtDocumentsPage from '../pages/uploadCourtDocumentsPage'

context('Is Upload Court Documents have', () => {
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

  it('displays correct text', () => {
    // uploadCourtDocumentsPage.subtText('contain.text', 'Meza, Cormac')
  })
})
