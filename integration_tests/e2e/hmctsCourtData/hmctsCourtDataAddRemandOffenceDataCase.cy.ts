import dayjs from 'dayjs'
import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
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
import HmctsCourtDataLandingPage from '../../pages/hmctsCourtDataLandingPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'

context('New Remand Court Case from hmcts data journey with offence data', () => {
  const remandWarrantHearingId = 'abf395c2-8e3c-419c-bd9c-71d544e5d811'
  const futureDate = dayjs().add(10, 'day')
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubCreateCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubOffencesForHmctsJourney')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAllAppearanceSubtypes')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '6d2eb21d-ec02-48fa-9fcd-02e73b8e45ca',
        outcomeName: 'Withdrawn',
        outcomeType: 'NON_CUSTODIAL',
      },
      {
        outcomeUuid: '315280e5-d53e-43b3-8ba6-44da25676ce2',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.task('stubHmctsRemandOffenceCourtData', { nextAppearanceDate: futureDate.format('YYYY-MM-DD') })
    cy.task('stubCreateCourtCase')
    cy.task('stubUploadDocument')
    cy.task('stubGetCourtHearing')
    cy.signIn()
    cy.visit(`/person/A1234AB/review-new-documents/${remandWarrantHearingId}/landing`)
  })

  it('fill in remand journey from hmcts court data', () => {
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '6d2eb21d-ec02-48fa-9fcd-02e73b8e45ca',
        outcomeName: 'Withdrawn',
        outcomeType: 'NON_CUSTODIAL',
      },
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
      {
        outcomeUuid: '315280e5-d53e-43b3-8ba6-44da25676ce2',
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
    const landingPage = Page.verifyOnPageTitle(HmctsCourtDataLandingPage, 'Review new documents and add a court case')
    landingPage
      .commonPlatformText()
      .should('contain.text', 'A new remand warrant for C894623 has been added from Common Platform.')
    landingPage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseAddHearingInformationPage = Page.verifyOnPage(CourtCaseOverallCaseOutcomeAppliedAllPage)
    courtCaseAddHearingInformationPage.radioLabelContains('No').click()
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
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().should('have.value', 'C894623')
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').should('have.value', '5')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').should('have.value', '7')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').should('have.value', '2026')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().should('have.value', 'Accrington Youth Court')
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '05/07/2026',
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
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.offencesLink().click()

    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')

    offenceCheckOffenceAnswersPage.editOffenceLink('3f0dd738-91e4-4557-bb33-0abd317b940f').click()

    let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editFieldLink('3f0dd738-91e4-4557-bb33-0abd317b940f', 'offence-outcome').click()
    const offenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')
    offenceOutcomePage.radioLabelContains('Remanded in custody').click()
    offenceOutcomePage.continueButton().click()
    offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
      Offence: 'PS90037 An offence description',
      'Committed on': '06/06/2026',
      Outcome: 'Remanded in custody',
    })
    offenceEditOffencePage.continueButton().click()

    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')
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
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.nextCourtAppearanceLink().click()

    const courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
    courtCaseNextAppearanceSetPage.radioSelector('true').should('be.checked')
    courtCaseNextAppearanceSetPage.radioSelector('false').should('not.be.checked')
    courtCaseNextAppearanceSetPage.continueButton().click()

    const courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
    courtCaseNextAppearanceTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextAppearanceTypePage.continueButton().click()

    const courtCaseNextAppearanceSubtypePage = Page.verifyOnPage(CourtCaseNextAppearanceSubtypePage)
    courtCaseNextAppearanceSubtypePage.radioLabelContains('Discharged to court').click()
    courtCaseNextAppearanceSubtypePage.continueButton().click()

    const courtCaseNextAppearanceDatePage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)
    courtCaseNextAppearanceDatePage
      .dayDateInput('nextAppearanceDate')
      .should('have.value', futureDate.date().toString())
    courtCaseNextAppearanceDatePage
      .monthDateInput('nextAppearanceDate')
      .should('have.value', (futureDate.month() + 1).toString())
    courtCaseNextAppearanceDatePage
      .yearDateInput('nextAppearanceDate')
      .should('have.value', futureDate.year().toString())
    courtCaseNextAppearanceDatePage.continueButton().click()

    const courtCaseNextAppearanceCourtSetPage = Page.verifyOnPage(CourtCaseNextAppearanceCourtSetPage)
    courtCaseNextAppearanceCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextAppearanceCourtSetPage.continueButton().click()

    const courtCaseNextAppearanceAnswersPage = Page.verifyOnPage(CourtCaseCheckNextAppearanceAnswersPage)
    courtCaseNextAppearanceAnswersPage
      .summaryList()
      .getSummaryList()
      .should('deep.equal', {
        Date: `${futureDate.format('DD/MM/YYYY')} 10:00`,
        Location: 'Accrington Youth Court',
        'Discharge type': 'Discharged to court',
        'Appearance type': 'Court appearance',
      })
    courtCaseNextAppearanceAnswersPage.continueButton().click()

    // Verify uploaded document has not been created yet.
    cy.task('verifyCreateDocumentForCommonPlatformDocuments', {
      documentId: 'doc-uuid-1',
    }).should('equal', 0)

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
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.continueButton().click()

    // Verify uploaded document has been created when court case is submitted.
    cy.task('verifyCreateDocumentForCommonPlatformDocuments', {
      documentId: 'doc-uuid-1',
    }).should('equal', 1)
    cy.task('verifyNonSentenceCreateCourtCaseRequestFromHmctsOffenceData', {
      nextAppearanceDate: futureDate.format('YYYY-MM-DD'),
    }).should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })
})
