import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

context('Add Offence Outcome Page', () => {
  let offenceOffenceOutcomePage: OffenceOffenceOutcomePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/1/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
  })

  it('displays person details', () => {
    offenceOffenceOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceOutcomePage.button().should('contain.text', 'Continue')
  })
})
