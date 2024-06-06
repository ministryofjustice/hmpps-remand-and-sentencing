import CourtCaseWarrantUploadPage from '../pages/courtCaseWarrantUploadPage'
import Page from '../pages/page'

context('Warrant upload page', () => {
  let courtCaseWarrantUploadPage: CourtCaseWarrantUploadPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-upload')
    courtCaseWarrantUploadPage = Page.verifyOnPage(CourtCaseWarrantUploadPage)
  })

  it('displays person details', () => {
    courtCaseWarrantUploadPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantUploadPage.button().should('contain.text', 'Continue')
  })
})
