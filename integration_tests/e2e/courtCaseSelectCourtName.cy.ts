import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import Page from '../pages/page'

context('Select court name page', () => {
  let courtCaseSelectCourtNamePage: CourtCaseSelectCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/select-court-name',
    )
    courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Birmingham Crown Court?',
    )
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

  it('submitting without selecting anything in the input results in an error', () => {
    courtCaseSelectCourtNamePage.button().click()
    courtCaseSelectCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', "There is a problem Select 'Yes' if the appearance was at this court.")
  })
})
