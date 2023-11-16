import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import Page from '../pages/page'

context('Next hearing type page', () => {
  let courtCaseNextHearingTypePage: CourtCaseNextHearingTypePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/next-hearing-type')
    courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingTypePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingTypePage.button().should('contain.text', 'Continue')
  })
})
