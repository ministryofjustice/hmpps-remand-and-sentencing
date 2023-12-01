import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'

context('Add Offence Offence Code Page', () => {
  let offenceOffenceCodePage: OffenceOffenceCodePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/court-cases/0/appearance/0/offences/0/offence-code')
    offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
  })

  it('displays person details', () => {
    offenceOffenceCodePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceCodePage.button().should('contain.text', 'Continue')
  })
})
