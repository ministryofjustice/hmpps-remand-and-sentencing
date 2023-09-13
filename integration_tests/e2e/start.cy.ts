import StartPage from '../pages/startPage'

context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubAuthUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = new StartPage('Marvin Haggler')
  })

  it('displays person details', () => {
    startPage
      .ticketPanel()
      .should('contain.text', 'Marvin HagglerA1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to add a court case is displayed', () => {
    startPage.button().should('contain', 'Add a court case').and('have.attr', 'href', '/person/A1234AB/court-cases/add')
  })
})
