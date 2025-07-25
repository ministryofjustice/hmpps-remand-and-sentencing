import CourtCaseSelectReferencePage from '../pages/courtCaseSelectReferencePage'
import Page from '../pages/page'

context('Select reference page', () => {
  let courtCaseSelectReferencePage: CourtCaseSelectReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance', {})
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/select-reference',
    )
    courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseSelectReferencePage.continueButton().click()
    courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select ‘Yes’ if this appearance uses the same case reference.')
  })
})
