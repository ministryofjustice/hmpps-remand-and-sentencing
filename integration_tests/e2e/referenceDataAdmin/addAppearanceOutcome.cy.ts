import Page from '../../pages/page'
import AddAppearanceOutcomePage from '../../pages/AddAppearanceOutcomePage'

context('Add appearance outcome page', () => {
  let addAppearanceOutcomePage: AddAppearanceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
    cy.visit('/admin/appearance-outcomes/add')
    addAppearanceOutcomePage = Page.verifyOnPage(AddAppearanceOutcomePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestCreateAppearanceOutcome')
    addAppearanceOutcomePage.outcomeNameInput().type('Outcome name')
    addAppearanceOutcomePage.nomisCodeInput().type('1234')
    addAppearanceOutcomePage.displayOrderInput().type('50')
    addAppearanceOutcomePage.continueButton().click()
    addAppearanceOutcomePage = Page.verifyOnPage(AddAppearanceOutcomePage)
    addAppearanceOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem nomisCode outcome code is already mapped')
  })
})
