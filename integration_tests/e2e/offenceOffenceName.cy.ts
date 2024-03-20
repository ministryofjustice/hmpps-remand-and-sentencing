import OffenceOffenceNamePage from '../pages/offenceOffenceNamePage'
import Page from '../pages/page'

context('Add Offence Offence Name Page', () => {
  let offenceOffenceNamePage: OffenceOffenceNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubSearchOffenceByName')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/offence-name')
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
