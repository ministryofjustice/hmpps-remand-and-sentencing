import Page from '../../pages/page'
import UploadBreachOrderPage from '../../pages/UploadBreachOrderPage'
import ViewBreachOrderPage from '../../pages/ViewBreachOrderPage'
import BreachDeleteDocumentPage from '../../pages/BreachDeleteDocumentPage'

context('Remove document confirmation page', () => {
  let breachDeleteDocumentPage: BreachDeleteDocumentPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubUploadTempDocument', {
      type: 'BREACH_ORDER',
    })
    cy.task('stubUploadDocument')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/upload-breach-order')
    const uploadBreachOrderPage = Page.verifyOnPage(UploadBreachOrderPage)
    uploadBreachOrderPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadBreachOrderPage.continueButton().click()
    cy.location('pathname').should('include', '/view-breach-order')
    const viewBreachOrderPage = Page.verifyOnPage(ViewBreachOrderPage)
    viewBreachOrderPage.removeDocumentLink('BREACH_ORDER').click()
    breachDeleteDocumentPage = Page.verifyOnPage(BreachDeleteDocumentPage)
  })

  it('submitting without selecting anything results in error', () => {
    breachDeleteDocumentPage.continueButton().click()
    breachDeleteDocumentPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select an option.')
  })

  it('after confirm and continue the upload breach order page should appear', () => {
    breachDeleteDocumentPage.radioLabelSelector('true').click()
    breachDeleteDocumentPage.continueButton().click()
    Page.verifyOnPage(UploadBreachOrderPage)
  })

  it('selecting false returns back to view appeal order page', () => {
    breachDeleteDocumentPage.radioLabelSelector('false').click()
    breachDeleteDocumentPage.continueButton().click()
    Page.verifyOnPage(ViewBreachOrderPage)
  })
})
