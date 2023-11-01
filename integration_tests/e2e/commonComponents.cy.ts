import IndexPage from '../pages/index'
import Page from '../pages/page'

context('Common Components', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubComponents')
  })

  it('Commmon components header and footer are displayed', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.commonComponentsHeader().should('exist')
    indexPage.commonComponentsFooter().should('exist')
  })
})
