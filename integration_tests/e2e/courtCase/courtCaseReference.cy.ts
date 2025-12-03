import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import Page from '../../pages/page'

context('Court Case Reference Page', () => {
  let courtCaseReferencePage: CourtCaseReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')
    courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
  })

  it('submitting without entering anything in the input results in an error', () => {
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the case reference')
  })

  it('submitting illegal characters results in an error', () => {
    courtCaseReferencePage.input().type(`CC,DF!@£${String.fromCharCode(0)}`)
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        "There is a problem You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Case referenceYou can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a case reference.",
      )
  })

  it('submitting without at least 1 number results in an error', () => {
    courtCaseReferencePage.input().type('ABC-DEF')
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Case references should include at least one number')
  })

  it('caption should only be shown for add court appearance journey', () => {
    courtCaseReferencePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add hearing information')
  })
  it('submtting greater than 13 characters results in an error', () => {
    courtCaseReferencePage.input().type('ABCDEFGHIJKLM1')
    courtCaseReferencePage.continueButton().click()
    courtCaseReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Case references must not be longer than 13 characters')
  })
})
