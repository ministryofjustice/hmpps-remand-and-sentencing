import Page from '../../pages/page'
import EditSentenceTypePage from '../../pages/EditSentenceTypePage'
import AdminSentenceTypePage from '../../pages/AdminSentenceTypePage'

context('Edit appearance outcome page', () => {
  let editSentenceTypePage: EditSentenceTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllSentenceTypes')
    cy.task('stubGetSentenceTypeDetails')
    cy.signIn()
    cy.visit('/admin/sentence-type')
    const adminSentenceTypePage = Page.verifyOnPage(AdminSentenceTypePage)
    adminSentenceTypePage.editLink('467e2fa8-fce1-41a4-8110-b378c727eed3').click()
    editSentenceTypePage = Page.verifyOnPage(EditSentenceTypePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestUpdateSentenceType')
    editSentenceTypePage.radioSelector('true').should('be.checked')
    editSentenceTypePage.descriptionInput().clear().type('Sentence type name')
    editSentenceTypePage.nomisCjaCodeInput().clear().type('1234')
    editSentenceTypePage.displayOrderInput().clear().type('50')
    editSentenceTypePage.continueButton().click()
    editSentenceTypePage = Page.verifyOnPage(EditSentenceTypePage)
    editSentenceTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem CJA code and Sentence Calc Type combination is already mapped')
  })
})
