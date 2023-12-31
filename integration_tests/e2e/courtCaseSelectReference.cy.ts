import CourtCaseSelectReferencePage from '../pages/courtCaseSelectReferencePage'
import Page from '../pages/page'

context('Select reference page', () => {
  let courtCaseSelectReferencePage: CourtCaseSelectReferencePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/1/select-reference')
    courtCaseSelectReferencePage = Page.verifyOnPage(CourtCaseSelectReferencePage)
  })

  it('displays person details', () => {
    courtCaseSelectReferencePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseSelectReferencePage.button().should('contain.text', 'Continue')
  })
})
