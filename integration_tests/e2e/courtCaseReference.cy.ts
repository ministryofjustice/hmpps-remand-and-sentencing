import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import Page from '../pages/page'

context('Court Case Reference Page', () => {
  let courtCaseReferencePage: CourtCaseReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/reference')
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
})
