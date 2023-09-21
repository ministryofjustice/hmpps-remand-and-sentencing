import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'

context('Court Case Warrant Date Page', () => {
  let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/warrant-date')
    courtCaseWarrantDatePage = new CourtCaseWarrantDatePage('Marvin Haggler')
  })

  it('displays person details', () => {
    courtCaseWarrantDatePage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantDatePage.button().should('contain.text', 'Continue')
  })
})
