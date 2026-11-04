import Page from '../../pages/page'
import AddHmctsResultCodePage from '../../pages/AddHmctsResultCodePage'

context('Add HMCTS result code page', () => {
  let addHmctsResultCodePage: AddHmctsResultCodePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetAllHmctsResultCodes')
    cy.signIn()
    cy.visit('/admin/hmcts-result-codes/add')
    addHmctsResultCodePage = Page.verifyOnPage(AddHmctsResultCodePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestCreateHmctsResultCode')
    addHmctsResultCodePage.resultNameInput().type('Remanded in custody')
    addHmctsResultCodePage.resultCodeInput().type('3452')
    addHmctsResultCodePage.outcomeUuidInput().type('85ffc6bf-6a2c-4f2b-8db8-5b466b602537')
    addHmctsResultCodePage.statusInput().type('ACTIVE')
    addHmctsResultCodePage.continueButton().click()
    addHmctsResultCodePage = Page.verifyOnPage(AddHmctsResultCodePage)
    addHmctsResultCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem resultCode HMCTS result code is already mapped')
  })
})
