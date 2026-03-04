import Page from '../../pages/page'
import EditAppearanceOutcomePage from '../../pages/EditAppearanceOutcomePage'

context('Edit appearance outcome page', () => {
  let editAppearanceOutcomePage: EditAppearanceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/admin/appearance-outcomes/edit/85ffc6bf-6a2c-4f2b-8db8-5b466b602537')
    editAppearanceOutcomePage = Page.verifyOnPage(EditAppearanceOutcomePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestUpdateAppearanceOutcome')
    editAppearanceOutcomePage.outcomeNameInput().clear().type('Outcome name')
    editAppearanceOutcomePage.nomisCodeInput().clear().type('1234')
    editAppearanceOutcomePage.displayOrderInput().clear().type('50')
    editAppearanceOutcomePage.continueButton().click()
    editAppearanceOutcomePage = Page.verifyOnPage(EditAppearanceOutcomePage)
    editAppearanceOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem nomisCode outcome code is already mapped')
  })
})
