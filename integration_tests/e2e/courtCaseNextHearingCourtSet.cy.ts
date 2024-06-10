import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingCourtSetPage: CourtCaseNextHearingCourtSetPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-court-select')
    courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingCourtSetPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingCourtSetPage.button().should('contain.text', 'Continue')
  })
})
