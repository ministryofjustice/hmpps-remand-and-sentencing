import CriminalOfficeReferencePage from '../../pages/CriminalOfficeReferencePage'
import Page from '../../pages/page'

context('Criminal Office Reference page', () => {
  let criminalOfficeReferencePage: CriminalOfficeReferencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/criminal-office-reference')
    criminalOfficeReferencePage = Page.verifyOnPage(CriminalOfficeReferencePage)
  })

  it('submitting without entering anything in the input results in an error', () => {
    criminalOfficeReferencePage.continueButton().click()
    criminalOfficeReferencePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the Criminal Appeal Office reference number')
  })

  it('submitting illegal characters results in an error', () => {
    criminalOfficeReferencePage.input().type(`CC,DF!@£${String.fromCharCode(0)}`)
    criminalOfficeReferencePage.continueButton().click()
    criminalOfficeReferencePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        "There is a problem You can only use spaces, letters, numbers and symbols '/', '.' and '-' when entering a Criminal Appeal Office reference numberYou can only use spaces, letters, numbers, hyphens, forward slashes and full stops when entering a criminal appeal office reference number.",
      )
  })
})
