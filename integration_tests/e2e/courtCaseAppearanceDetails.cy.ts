import CourtCaseAppearanceDetailsPage from '../pages/courtCaseAppearanceDetailsPage'
import Page from '../pages/page'

context('Court Case Appearance details Page', () => {
  let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAppearanceDetails')
    cy.task('stubGetOffencesByCodes', {})
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
    )
    courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
      CourtCaseAppearanceDetailsPage,
      'Edit appearance C894623 at Birmingham Crown Court on 15 12 2023',
    )
  })

  it('displays person details', () => {
    courtCaseAppearanceDetailsPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to confirm changes is displayed', () => {
    courtCaseAppearanceDetailsPage.button().should('contain.text', 'Confirm changes')
  })
})
