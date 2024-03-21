import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import Page from '../pages/page'

context('Add Offence Offence Date Page', () => {
  let offenceOffenceDatePage: OffenceOffenceDatePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/offence-date')
    offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
  })

  it('displays person details', () => {
    offenceOffenceDatePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceDatePage.button().should('contain.text', 'Continue')
  })
})
