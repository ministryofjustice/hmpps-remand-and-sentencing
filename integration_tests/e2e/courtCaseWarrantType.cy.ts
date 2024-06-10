import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'

context('Warrant type page', () => {
  let courtCaseWarrantTypePage: CourtCaseWarrantTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
  })

  it('displays person details', () => {
    courtCaseWarrantTypePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantTypePage.button().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in error', () => {
    courtCaseWarrantTypePage.button().click()
    courtCaseWarrantTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the type of warrant')
  })
})
