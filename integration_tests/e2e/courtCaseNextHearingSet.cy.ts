import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingSetPage: CourtCaseNextHearingSetPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/court-cases/0/appearance/0/next-hearing-select')
    courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingSetPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingSetPage.button().should('contain.text', 'Continue')
  })
})
