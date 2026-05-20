import AppealCheckHearingAnswersPage from '../../pages/AppealCheckHearingAnswersPage'
import AppealConfirmationPage from '../../pages/AppealConfirmationPage'
import AppealCourtNamePage from '../../pages/AppealCourtNamePage'
import AppealDatePage from '../../pages/AppealDatePage'
import AppealOverallCaseOutcomePage from '../../pages/AppealOverallCaseOutcomePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CriminalOfficeReferencePage from '../../pages/CriminalOfficeReferencePage'
import Page from '../../pages/page'
import RecordAppealPage from '../../pages/RecordAppealPage'
import SelectOffenceAppealOutcomePage from '../../pages/SelectOffenceAppealOutcomePage'
import StartPage from '../../pages/startPage'
import UploadAppealOrderPage from '../../pages/UploadAppealOrderPage'
import ViewAppealOrderPage from '../../pages/ViewAppealOrderPage'

context('Appeals journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetLatestCourtAppearance', {
      courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
    })
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
      latestSentenceAppearanceDate: '2000-01-01',
    })
    cy.task('stubGetSentencedCharges', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubUploadTempDocument', {
      type: 'APPEAL_ORDER',
    })
    cy.task('stubUploadDocument')
    cy.task('stubCreateAppealHearing')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })
  it('fill in appeals journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppealsLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Incomplete',
        },
        {
          name: 'Record appeal',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()
    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()
    const criminalOfficeReferencePage = Page.verifyOnPage(CriminalOfficeReferencePage)
    criminalOfficeReferencePage.input().type('A12345')
    criminalOfficeReferencePage.continueButton().click()
    const appealDatePage = Page.verifyOnPage(AppealDatePage)
    appealDatePage.dayDateInput('appealDate').type('13')
    appealDatePage.monthDateInput('appealDate').type('5')
    appealDatePage.yearDateInput('appealDate').type('2023')
    appealDatePage.continueButton().click()
    const appealCourtNamePage = Page.verifyOnPage(AppealCourtNamePage)
    appealCourtNamePage.autoCompleteInput().type('cou')
    appealCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    appealCourtNamePage.firstAutoCompleteOption().click()
    appealCourtNamePage.continueButton().click()
    const appealOverallCaseOutcomePage = Page.verifyOnPage(AppealOverallCaseOutcomePage)
    appealOverallCaseOutcomePage.radioLabelContains('Sentence varied').click()
    appealOverallCaseOutcomePage.continueButton().click()
    const appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
    appealCheckHearingAnswersPage.continueButton().click()
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Record appeal',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.recordAppealLink().click()
    let recordAppealPage = Page.verifyOnPage(RecordAppealPage)
    recordAppealPage
      .otherOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '20/05/2025',
          'Conviction date': '12/10/2023',
          Outcome: 'Imprisonment',
          'Sentence type': 'A NOMIS Sentence Type',
          'Sentence length': '1 years 0 months 0 weeks 0 days',
          'Consecutive or concurrent': 'Forthwith',
        },
      ])
    recordAppealPage.recordOffenceAppealLink('6683ebbb-f6a6-4744-8603-371135c36913').click()
    const selectOffenceAppealOutcomePage = Page.verifyOnPage(SelectOffenceAppealOutcomePage)
    selectOffenceAppealOutcomePage.radioLabelContains('Sentence varied').click()
    selectOffenceAppealOutcomePage.continueButton().click()
    recordAppealPage = Page.verifyOnPage(RecordAppealPage)
    recordAppealPage
      .appealedOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '20/05/2025',
          Outcome: 'Sentence varied',
        },
      ])
    recordAppealPage.radioLabelContains(`Yes, I've finished`).click()
    recordAppealPage.continueButton().click()
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Record appeal',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.uploadCourtDocumentsLink().click()
    const uploadAppealOrderPage = Page.verifyOnPage(UploadAppealOrderPage)
    uploadAppealOrderPage.fileInput().selectFile('cypress/fixtures/testfile.doc')
    uploadAppealOrderPage.continueButton().click()
    cy.location('pathname').should('include', '/view-appeal-order')
    const viewAppealOrderPage = Page.verifyOnPage(ViewAppealOrderPage)
    viewAppealOrderPage.continueButton().click()
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Record appeal',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Completed',
        },
      ])
    courtCaseTaskListPage.continueButton().click()
    cy.task('verifyCreateAppealHearingRequest').should('equal', 1)
    Page.verifyOnPage(AppealConfirmationPage)
  })
})
