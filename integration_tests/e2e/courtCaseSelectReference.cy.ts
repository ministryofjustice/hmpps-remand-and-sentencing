import CourtCaseSelectReferencePage from '../pages/courtCaseSelectReferencePage'
import Page from '../pages/page'

context('Select reference page', () => {
  let courtCaseSelectReferencePage: CourtCaseSelectReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/select-reference',
    )
    courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
  })

  it('displays person details', () => {
    courtCaseSelectReferencePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseSelectReferencePage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseSelectReferencePage.button().click()
    courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select ‘Yes’ if this appearance uses the same case reference.')
  })
})
