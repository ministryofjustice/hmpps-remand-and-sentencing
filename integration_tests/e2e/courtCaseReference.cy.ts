import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import Page from '../pages/page'

context('Court Case Reference Page', () => {
  let courtCaseReferencePage: CourtCaseReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')
    courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
  })

  it('displays person details', () => {
    courtCaseReferencePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseReferencePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the case reference')
  })

  it('submitting illegal characters results in an error', () => {
    courtCaseReferencePage.input().type(`CC,DF!@£${String.fromCharCode(0)}`)
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        "There is a problem You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Case referenceYou can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a case reference.",
      )
  })

  it('submitting without at least 1 number results in an error', () => {
    courtCaseReferencePage.input().type('ABC-DEF')
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Case references should include at least one number')
  })
})
