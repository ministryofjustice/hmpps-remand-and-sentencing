import Page from '../../pages/page'
import AdminHmctsResultCodePage from '../../pages/AdminHmctsResultCodePage'
import EditHmctsResultCode from '../../pages/EditHmctsResultCodePage'

context('Edit HMCTS result code page', () => {
  let editHmctsResultCodePage: EditHmctsResultCode
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetAllHmctsResultCodes')
    cy.signIn()
    cy.visit('/admin/hmcts-result-codes')

    const adminHmctsResultCodePage = Page.verifyOnPage(AdminHmctsResultCodePage)
    adminHmctsResultCodePage.editLink('bff8834a-bb17-4e2b-8336-32505be88c3a').click()

    editHmctsResultCodePage = Page.verifyOnPage(EditHmctsResultCode)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestUpdateHmctsResultCode')
    editHmctsResultCodePage.resultNameInput().type('Remanded in custody')
    editHmctsResultCodePage.resultCodeInput().type('7863')
    editHmctsResultCodePage.outcomeUuidInput().type('bff8834a-bb17-4e2b-8336-32505be88c3a')
    editHmctsResultCodePage.statusInput().type('ACTIVE')
    editHmctsResultCodePage.continueButton().click()
    editHmctsResultCodePage = Page.verifyOnPage(EditHmctsResultCode)
    editHmctsResultCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem resultCode HMCTS result code is already mapped')
  })
})
