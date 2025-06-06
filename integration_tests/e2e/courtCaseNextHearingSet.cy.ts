import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'
import Page from '../pages/page'

context('Next hearing been set page', () => {
  let courtCaseNextHearingSetPage: CourtCaseNextHearingSetPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-select')
    courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingSetPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingSetPage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseNextHearingSetPage.continueButton().click()
    courtCaseNextHearingSetPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the hearing has been set')
  })
})
