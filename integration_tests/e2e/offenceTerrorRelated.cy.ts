import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'
import Page from '../pages/page'

context('Add Offence Terror related Page', () => {
  let offenceTerrorRelatedPage: OffenceTerrorRelatedPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/terror-related')
    offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
  })

  it('displays person details', () => {
    offenceTerrorRelatedPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceTerrorRelatedPage.button().should('contain.text', 'Continue')
  })
})
