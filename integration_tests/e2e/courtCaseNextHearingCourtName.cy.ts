import CourtCaseNextHearingCourtNamePage from '../pages/courtCaseNextHearingCourtNamePage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingCourtNamePage: CourtCaseNextHearingCourtNamePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/next-hearing-court-name')
    courtCaseNextHearingCourtNamePage = Page.verifyOnPage(CourtCaseNextHearingCourtNamePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingCourtNamePage.button().should('contain.text', 'Continue')
  })
})
