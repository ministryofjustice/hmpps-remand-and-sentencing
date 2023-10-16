import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'

context('Add Offence Offence Code Page', () => {
  let offenceOffenceCodeConfirmPage: OffenceOffenceCodeConfirmPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetOffenceByCode')
    cy.signIn()
    cy.createCourtCase('A1234AB', '12345')
    cy.visit('/person/A1234AB/court-cases/12345/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('CC12345')
    offenceOffenceCodePage.button().click()
    offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
  })

  it('displays person details', () => {
    offenceOffenceCodeConfirmPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceCodeConfirmPage.button().should('contain.text', 'Confirm and continue')
  })
})