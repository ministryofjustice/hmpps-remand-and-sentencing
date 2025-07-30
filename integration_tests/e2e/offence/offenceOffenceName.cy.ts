import OffenceOffenceNamePage from '../../pages/offenceOffenceNamePage'
import Page from '../../pages/page'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'

context('Add Offence Offence Name Page', () => {
  let offenceOffenceNamePage: OffenceOffenceNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchOffenceByName')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-name')
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the offence')
  })

  it('submitting an invalid offence results in an error', () => {
    offenceOffenceNamePage.autoCompleteInput().type('an invalid offence')
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid offence.')
  })

  it('Clearing the the selection removes all text from the auto complete field', () => {
    offenceOffenceNamePage.autoCompleteInput().type('invalid offence text')
    offenceOffenceNamePage.autoCompleteInput().should('have.value', 'invalid offence text')
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage.autoCompleteInput().click()
    offenceOffenceNamePage.clearTheSelection().click()
    offenceOffenceNamePage.autoCompleteInput().should('have.value', '')
  })

  it('Entering an offence via the Offence Name route navigates to the offence-confirmation page', () => {
    cy.visit(`/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type`)
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()

    cy.visit(`/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date`)
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('16')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('8')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear()
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.unknownCodeCheckbox().check()
    offenceOffenceCodePage.continueButton().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage.autoCompleteInput().type('PS90037 An offence description')
    offenceOffenceNamePage.continueButton().click()
    Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
  })
})
