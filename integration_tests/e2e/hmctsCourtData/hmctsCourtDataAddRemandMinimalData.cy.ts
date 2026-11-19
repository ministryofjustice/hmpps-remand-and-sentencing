import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import HmctsCourtDataLandingPage from '../../pages/hmctsCourtDataLandingPage'
import CourtCaseNextAppearanceSetPage from '../../pages/courtCaseNextAppearanceSetPage'
import CourtCaseCheckNextAppearanceAnswersPage from '../../pages/courtCaseCheckNextAppearanceAnswersPage'

context('New Remand Court Case from hmcts data journey with minimal data', () => {
  const remandWarrantHearingId = 'abf395c2-8e3c-419c-bd9c-71d544e5d811'
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubCreateCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubOffencesForHmctsJourney')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
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
    cy.task('stubHmctsRemandMinimalCourtData')
    cy.task('stubCreateCourtCase')
    cy.task('stubUploadDocument')
    cy.task('stubGetCourtHearing')
    cy.task('stubDocumentViewed')
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
    courtCaseOverallCaseOutcomePage
      .radioSelector('6da892fa-d85e-44de-95d4-a7f06c3a2dcb|85ffc6bf-6a2c-4f2b-8db8-5b466b602537')
      .click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

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
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
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
    courtCaseTaskListPage.nextCourtAppearanceLink().click()

    const courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
    courtCaseNextAppearanceSetPage.radioSelector('true').should('not.be.checked')
    courtCaseNextAppearanceSetPage.radioSelector('false').should('be.checked')
    courtCaseNextAppearanceSetPage.continueButton().click()

    const courtCaseNextAppearanceAnswersPage = Page.verifyOnPage(CourtCaseCheckNextAppearanceAnswersPage)
    courtCaseNextAppearanceAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Next appearance set': 'Date to be fixed',
    })
    courtCaseNextAppearanceAnswersPage.continueButton().click()
  })
})
