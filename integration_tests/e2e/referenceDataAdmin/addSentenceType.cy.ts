import Page from '../../pages/page'
import AddSentenceTypePage from '../../pages/AddSentenceTypePage'

context('Add sentence type page', () => {
  let addSentenceTypePage: AddSentenceTypePage
  beforeEach(() => {
    cy.signIn()
    cy.visit('/admin/sentence-type/add')
    addSentenceTypePage = Page.verifyOnPage(AddSentenceTypePage)
  })

  it('displays errors from API correctly', () => {
    cy.task('stubBadRequestCreateSentenceType')
    addSentenceTypePage.descriptionInput().type('Outcome name')
    addSentenceTypePage.nomisCjaCodeInput().type('1234')
    addSentenceTypePage.displayOrderInput().type('50')
    addSentenceTypePage.continueButton().click()
    addSentenceTypePage = Page.verifyOnPage(AddSentenceTypePage)
    addSentenceTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem CJA code and Sentence Calc Type combination is already mapped')
  })
})
