import Page from '../../pages/page'
import EditChargeOutcomePage from '../../pages/EditChargeOutcomePage'

context('Edit charge outcome page', () => {
  let editChargeOutcomePage: EditChargeOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/admin/charge-outcomes/edit/85ffc6bf-6a2c-4f2b-8db8-5b466b602537')
    editChargeOutcomePage = Page.verifyOnPage(EditChargeOutcomePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestUpdateChargeOutcome')
    editChargeOutcomePage.outcomeNameInput().clear().type('Outcome name')
    editChargeOutcomePage.nomisCodeInput().clear().type('1234')
    editChargeOutcomePage.displayOrderInput().clear().type('50')
    editChargeOutcomePage.continueButton().click()
    editChargeOutcomePage = Page.verifyOnPage(EditChargeOutcomePage)
    editChargeOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem nomisCode outcome code is already mapped')
  })
})
