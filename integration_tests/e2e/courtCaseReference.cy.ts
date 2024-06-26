import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import Page from '../pages/page'

context('Court Case Reference Page', () => {
  let courtCaseReferencePage: CourtCaseReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')
    courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
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
    courtCaseReferencePage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseReferencePage.button().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the case reference')
  })

  it('submitting an invalid format results in an error', () => {
    courtCaseReferencePage.input().type('123')
    courtCaseReferencePage.button().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid court case reference number.')
  })
})
