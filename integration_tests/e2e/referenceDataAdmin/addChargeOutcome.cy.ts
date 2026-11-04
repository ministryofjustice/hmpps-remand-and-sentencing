import Page from '../../pages/page'
import AddChargeOutcomePage from '../../pages/AddChargeOutcomePage'

context('Add charge outcome page', () => {
  let addChargeOutcomePage: AddChargeOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/admin/charge-outcomes/add')
    addChargeOutcomePage = Page.verifyOnPage(AddChargeOutcomePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestCreateChargeOutcome')
    addChargeOutcomePage.outcomeNameInput().type('Outcome name')
    addChargeOutcomePage.nomisCodeInput().type('1234')
    addChargeOutcomePage.displayOrderInput().type('50')
    addChargeOutcomePage.continueButton().click()
    addChargeOutcomePage = Page.verifyOnPage(AddChargeOutcomePage)
    addChargeOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem nomisCode outcome code is already mapped')
  })
})
