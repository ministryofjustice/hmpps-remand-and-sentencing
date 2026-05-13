import AppealCheckHearingAnswersPage from '../../pages/AppealCheckHearingAnswersPage'
import AppealCourtNamePage from '../../pages/AppealCourtNamePage'
import AppealDatePage from '../../pages/AppealDatePage'
import AppealOverallCaseOutcomePage from '../../pages/AppealOverallCaseOutcomePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CriminalOfficeReferencePage from '../../pages/CriminalOfficeReferencePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Appeal check hearing answers page', () => {
  let appealCheckHearingAnswersPage: AppealCheckHearingAnswersPage
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
    cy.signIn()
    cy.visit('/person/A1234AB')
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppealsLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
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
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('can edit case reference number and return back', () => {
    appealCheckHearingAnswersPage.editCaseReferenceNumberLink().click()
    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().should('have.value', 'C894623').clear().type('G35266')
    courtCaseReferencePage.continueButton().click()
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'G35266',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('can edit criminal appeal office reference number and return back', () => {
    appealCheckHearingAnswersPage.editCriminalAppealOfficeReferenceLink().click()
    const criminalOfficeReferencePage = Page.verifyOnPage(CriminalOfficeReferencePage)
    criminalOfficeReferencePage.input().should('have.value', 'A12345').clear().type('B6789')
    criminalOfficeReferencePage.continueButton().click()
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'B6789',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('can edit date of appeal and return back', () => {
    appealCheckHearingAnswersPage.editAppealDateLink().click()
    const appealDatePage = Page.verifyOnPage(AppealDatePage)
    appealDatePage.dayDateInput('appealDate').should('have.value', '13').clear().type('15')
    appealDatePage.monthDateInput('appealDate').should('have.value', '5').clear().type('6')
    appealDatePage.yearDateInput('appealDate').should('have.value', '2023').clear().type('2024')
    appealDatePage.continueButton().click()
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '15/06/2024',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('can edit court name and return back', () => {
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
    appealCheckHearingAnswersPage.editCourtNameLink().click()
    const appealCourtNamePage = Page.verifyOnPage(AppealCourtNamePage)
    appealCourtNamePage.autoCompleteInput().type('cou')
    appealCourtNamePage.secondAutoCompleteOption().contains('Southampton Magistrate Court').click()
    appealCourtNamePage.continueButton().click()
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Southampton Magistrate Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('can edit overall case outcome and return back', () => {
    appealCheckHearingAnswersPage.editOverallCaseOutcomeLink().click()
    const appealOverallCaseOutcomePage = Page.verifyOnPage(AppealOverallCaseOutcomePage)
    appealOverallCaseOutcomePage.radioLabelContains('Sentence quashed').click()
    appealOverallCaseOutcomePage.continueButton().click()
    appealCheckHearingAnswersPage = Page.verifyOnPage(AppealCheckHearingAnswersPage)
    appealCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Criminal Appeal Office reference number': 'A12345',
      'Date of appeal hearing': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Sentence quashed',
    })
  })
})
