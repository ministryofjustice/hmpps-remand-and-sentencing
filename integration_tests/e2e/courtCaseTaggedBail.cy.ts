import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'
import Page from '../pages/page'

context('Tagged bail page', () => {
  let courtCaseTaggedBailPage: CourtCaseTaggedBailPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/tagged-bail')
    courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
  })

  it('displays person details', () => {
    courtCaseTaggedBailPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseTaggedBailPage.button().should('contain.text', 'Continue')
  })
})
