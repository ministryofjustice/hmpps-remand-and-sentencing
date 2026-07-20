import BreachCheckHearingAnswersPage from '../../pages/BreachCheckHearingAnswersPage'
import BreachConfirmationPage from '../../pages/BreachConfirmationPage'
import BreachCourtNamePage from '../../pages/BreachCourtNamePage'
import BreachDatePage from '../../pages/BreachDatePage'
import BreachTypePage from '../../pages/BreachTypePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'
import UploadBreachOrderPage from '../../pages/UploadBreachOrderPage'
import ViewBreachOrderPage from '../../pages/ViewBreachOrderPage'

context('Breach journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
      latestSentenceAppearanceDate: '2000-01-01',
    })
    cy.task('stubUploadTempDocument', {
      type: 'BREACH_ORDER',
    })
    cy.task('stubUploadDocument')
    cy.task('stubGetDtoSentencedCharges', {})
    cy.task('stubCreateCourtAppearance')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })
  it('fill in breach of supervision requirements journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addBreachLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    const breachTypePage = Page.verifyOnPage(BreachTypePage)
    breachTypePage.continueButton().click()
    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a breach')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()
    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('C894623')
    courtCaseReferencePage.continueButton().click()
    const breachDatePage = Page.verifyOnPage(BreachDatePage)
    breachDatePage.dayDateInput('breachDate').type('13')
    breachDatePage.monthDateInput('breachDate').type('5')
    breachDatePage.yearDateInput('breachDate').type('2023')
    breachDatePage.continueButton().click()
    const breachCourtNamePage = Page.verifyOnPage(BreachCourtNamePage)
    breachCourtNamePage.autoCompleteInput().type('cou')
    breachCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    breachCourtNamePage.firstAutoCompleteOption().click()
    breachCourtNamePage.continueButton().click()
    const breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Hearing date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
    })
    breachCheckHearingAnswersPage.continueButton().click()
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a breach')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.uploadCourtDocumentsLink().click()
    const uploadBreachOrderPage = Page.verifyOnPage(UploadBreachOrderPage)
    uploadBreachOrderPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadBreachOrderPage.continueButton().click()
    cy.location('pathname').should('include', '/view-breach-order')
    const viewBreachOrderPage = Page.verifyOnPage(ViewBreachOrderPage)
    viewBreachOrderPage.continueButton().click()
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a breach')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.continueButton().click()
    cy.task('verifyCreateBreachHearingRequest').should('equal', 1)
    Page.verifyOnPage(BreachConfirmationPage)
  })
})
