import StartPage from '../pages/startPage'
import Page from '../pages/page'

context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  it('displays person details', () => {
    startPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'Date of birth03 02 1965')
      .and('contain.text', 'PNC number1231/XX/121')
      .and('contain.text', 'StatusREMAND')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to add a court case is displayed', () => {
    startPage
      .button()
      .should('contain', 'Add a court case')
      .and('have.attr', 'href', '/person/A1234AB/court-cases/0/appearance/0/reference')
  })
})
