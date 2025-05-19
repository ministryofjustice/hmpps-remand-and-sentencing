import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import Page from '../pages/page'

context('Next hearing type page', () => {
  let courtCaseNextHearingTypePage: CourtCaseNextHearingTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceTypes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-type')
    courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingTypePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingTypePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseNextHearingTypePage.continueButton().click()
    courtCaseNextHearingTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the next hearing type')
  })
})
