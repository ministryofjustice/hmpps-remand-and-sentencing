import BreachTypePage from '../../pages/BreachTypePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Breach journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })
  it('fill in breach of supervision requirements journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addBreachLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    Page.verifyOnPage(BreachTypePage)
  })
})
