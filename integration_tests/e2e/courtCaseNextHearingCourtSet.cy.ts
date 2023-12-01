import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingCourtSetPage: CourtCaseNextHearingCourtSetPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/court-cases/0/appearance/0/next-hearing-court-select')
    courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingCourtSetPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingCourtSetPage.button().should('contain.text', 'Continue')
  })
})
