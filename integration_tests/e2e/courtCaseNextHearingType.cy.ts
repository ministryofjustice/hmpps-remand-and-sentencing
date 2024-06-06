import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import Page from '../pages/page'

context('Next hearing type page', () => {
  let courtCaseNextHearingTypePage: CourtCaseNextHearingTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-type')
    courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingTypePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingTypePage.button().should('contain.text', 'Continue')
  })
})
