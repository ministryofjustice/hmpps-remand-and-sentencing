import CourtCaseReferencePage from '../pages/courtCaseReferencePage'

context('Court Case Reference Page', () => {
  let courtCaseReferencePage: CourtCaseReferencePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/reference')
    courtCaseReferencePage = new CourtCaseReferencePage('Marvin Haggler')
  })

  it('displays person details', () => {
    courtCaseReferencePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseReferencePage.button().should('contain.text', 'Continue')
  })
})
