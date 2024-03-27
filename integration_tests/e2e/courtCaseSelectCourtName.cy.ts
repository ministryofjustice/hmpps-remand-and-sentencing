import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import Page from '../pages/page'

context('Select court name page', () => {
  let courtCaseSelectCourtNamePage: CourtCaseSelectCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/12345/appearance/1/select-court-name')
    courtCaseSelectCourtNamePage = Page.verifyOnPage(CourtCaseSelectCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseSelectCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseSelectCourtNamePage.button().should('contain.text', 'Continue')
  })
})
