import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'

context('Court Case Warrant Date Page', () => {
  let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-date')
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
  })

  it('displays person details', () => {
    courtCaseWarrantDatePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantDatePage.button().should('contain.text', 'Continue')
  })
})
