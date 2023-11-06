import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import Page from '../pages/page'

context('Add Offence Offence Date Page', () => {
  let offenceOffenceDatePage: OffenceOffenceDatePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/offence-date')
    offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
  })

  it('displays person details', () => {
    offenceOffenceDatePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceDatePage.button().should('contain.text', 'Continue')
  })
})
