import OffenceOffenceNamePage from '../pages/offenceOffenceNamePage'
import Page from '../pages/page'

context('Add Offence Offence Name Page', () => {
  let offenceOffenceNamePage: OffenceOffenceNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.task('stubSearchOffenceByName')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/offence-name')
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
  })

  it('displays person details', () => {
    offenceOffenceNamePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceNamePage.button().should('contain.text', 'Continue')
  })
})