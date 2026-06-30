import dayjs from 'dayjs'
import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCheckNextAppearanceAnswersPage from '../../pages/courtCaseCheckNextAppearanceAnswersPage'
import CourtCaseNextAppearanceSetPage from '../../pages/courtCaseNextAppearanceSetPage'
import CourtCaseNextAppearanceDatePage from '../../pages/courtCaseNextAppearanceDatePage'
import CourtCaseNextAppearanceCourtSetPage from '../../pages/courtCaseNextAppearanceCourtSetPage'
import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'
import CourtCaseConfirmationPage from '../../pages/courtCaseConfirmationPage'
import CourtCaseNextAppearanceSubtypePage from '../../pages/courtCaseNextAppearanceSubtypePage'
import CourtCaseOverallCaseOutcomeAppliedAllPage from '../../pages/courtCaseOverallCaseOutcomeAppliedAllPage'
import HmctsCourtDataStartPage from '../../pages/hmctsCourtDataStartPage'

context('New Court Case from hmcts data journey', () => {
  const remandWarrantHearingId = 'abf395c2-8e3c-419c-bd9c-71d544e5d811'
  const futureDate = dayjs().add(10, 'day')
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubCreateCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAllAppearanceSubtypes')
    cy.task('stubHmctsCourtData')
    cy.task('stubCreateCourtCase')
    cy.signIn()
    cy.visit(`/person/A1234AB/review-new-documents/${remandWarrantHearingId}/landing`)
  })

  it('fill in remand journey from hmcts court data', () => {
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
      outcomeName: 'Remanded in custody',
      outcomeType: 'REMAND',
    })
    cy.task('stubGetAppearanceTypeByUuid')
    const startPage = Page.verifyOnPage(HmctsCourtDataStartPage)
    startPage.continueLink().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseAddHearingInformationPage = Page.verifyOnPage(CourtCaseOverallCaseOutcomeAppliedAllPage)
    courtCaseAddHearingInformationPage.radioLabelContains('Yes').click()
    courtCaseAddHearingInformationPage.continueButton().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'In progress',
        },
        {
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Next court appearance',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().should('have.value', 'C894623')
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').should('have.value', '15')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').should('have.value', '12')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').should('have.value', '2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '15/12/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Incomplete',
        },
        {
          name: 'Next court appearance',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional', // TODO should this stay as optional once some data is filled?
        },
      ])
    courtCaseTaskListPage.offencesLink().click()

    const offenceOffenceDatePage = Page.verifyOnPageTitle(
      OffenceOffenceDatePage,
      'Enter the offence dates for the first offence',
    )
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('10')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.hearingDetailsSummaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Court name': 'Accrington Youth Court',
      'Hearing date': '15/12/2023',
      'Overall case outcome': 'Remanded in custody',
    })
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Next court appearance',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.nextCourtAppearanceLink().click()

    const courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
    courtCaseNextAppearanceSetPage.radioLabelSelector('true').click()
    courtCaseNextAppearanceSetPage.continueButton().click()

    const courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
    courtCaseNextAppearanceTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextAppearanceTypePage.continueButton().click()

    const courtCaseNextAppearanceSubtypePage = Page.verifyOnPage(CourtCaseNextAppearanceSubtypePage)
    courtCaseNextAppearanceSubtypePage.radioLabelContains('Discharged to court').click()
    courtCaseNextAppearanceSubtypePage.continueButton().click()

    const courtCaseNextAppearanceDatePage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)

    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type(futureDate.date().toString())
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type((futureDate.month() + 1).toString())
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type(futureDate.year().toString())
    courtCaseNextAppearanceDatePage.continueButton().click()

    const courtCaseNextAppearanceCourtSetPage = Page.verifyOnPage(CourtCaseNextAppearanceCourtSetPage)
    courtCaseNextAppearanceCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextAppearanceCourtSetPage.continueButton().click()

    const courtCaseNextAppearanceAnswersPage = Page.verifyOnPage(CourtCaseCheckNextAppearanceAnswersPage)
    courtCaseNextAppearanceAnswersPage
      .summaryList()
      .getSummaryList()
      .should('deep.equal', {
        Date: futureDate.format('DD/MM/YYYY'),
        Location: 'Accrington Youth Court',
        'Discharge type': 'Discharged to court',
        'Appearance type': 'Court appearance',
      })
    courtCaseNextAppearanceAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Next court appearance',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.continueButton().click()

    cy.task('verifyNonSentenceCreateCourtCaseRequestFromHmctsData', {
      nextAppearanceDate: futureDate.format('YYYY-MM-DD'),
    }).should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })
})
