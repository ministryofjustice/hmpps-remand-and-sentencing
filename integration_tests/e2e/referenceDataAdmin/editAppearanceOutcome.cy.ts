import Page from '../../pages/page'
import EditAppearanceOutcomePage from '../../pages/EditAppearanceOutcomePage'
import AdminAppearanceOutcomePage from '../../pages/AdminAppearanceOutcomePage'

context('Edit appearance outcome page', () => {
  let editAppearanceOutcomePage: EditAppearanceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/admin/appearance-outcomes')
    const adminAppearanceOutcomePage = Page.verifyOnPage(AdminAppearanceOutcomePage)
    adminAppearanceOutcomePage.editLink('6da892fa-d85e-44de-95d4-a7f06c3a2dcb').click()
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
