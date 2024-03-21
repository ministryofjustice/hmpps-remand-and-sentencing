import CourtCaseLookupCaseOutcomePage from '../pages/courtCaseLookupCaseOutcomePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseLookupCaseOutcomePage: CourtCaseLookupCaseOutcomePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/lookup-case-outcome')
    courtCaseLookupCaseOutcomePage = Page.verifyOnPage(CourtCaseLookupCaseOutcomePage)
  })

  it('displays person details', () => {
    courtCaseLookupCaseOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseLookupCaseOutcomePage.button().should('contain.text', 'Continue')
  })
})
