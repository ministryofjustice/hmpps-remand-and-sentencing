import dayjs from 'dayjs'
import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCheckNextAppearanceAnswersPage from '../../pages/courtCaseCheckNextAppearanceAnswersPage'
import CourtCaseNextAppearanceSetPage from '../../pages/courtCaseNextAppearanceSetPage'
import CourtCaseNextAppearanceDatePage from '../../pages/courtCaseNextAppearanceDatePage'
import CourtCaseNextAppearanceCourtSetPage from '../../pages/courtCaseNextAppearanceCourtSetPage'
import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'
import CourtCaseConfirmationPage from '../../pages/courtCaseConfirmationPage'
import CourtCaseNextAppearanceSubtypePage from '../../pages/courtCaseNextAppearanceSubtypePage'
import HmctsCourtDataLandingPage from '../../pages/hmctsCourtDataLandingPage'
import HmctsCourtDataSelectCasePage from '../../pages/hmctsCourtDataSelectCasePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseSelectCourtNamePage from '../../pages/courtCaseSelectCourtNamePage'
import OffenceReviewOffencesPage from '../../pages/offenceReviewOffencesPage'
import OffenceUpdateOutcomePage from '../../pages/offenceUpdateOutcomePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'

context('New Remand hearing from hmcts data journey', () => {
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
    cy.task('stubGetLatestCourtAppearance', { courtCaseUuid: '84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b' })
    cy.task('stubGetCourtCaseValidationDates', { courtCaseUuid: '84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b' })
    cy.task('stubHmctsRemandCourtData')
    cy.task('stubCreateCourtCase')
    cy.task('stubUploadDocument')
    cy.task('stubGetCourtHearing')
    cy.task('stubCreateCourtAppearance')
    cy.signIn()
    cy.visit(`/person/A1234AB/review-new-documents/${remandWarrantHearingId}/landing/existing-case`)
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
    const landingPage = Page.verifyOnPage(HmctsCourtDataLandingPage)
    landingPage
      .commonPlatformText()
      .should('contain.text', 'A new remand warrant for C894623 has been added from Common Platform.')
    landingPage.radioLabelContains('Add a new hearing to an existing court case').click()
    landingPage.continueButton().click()

    const selectCasePage = Page.verifyOnPage(HmctsCourtDataSelectCasePage)
    selectCasePage.radioLabelContains('C894623 at Accrington Youth Court last heard on 15/12/2023').eq(1).click()
    landingPage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'In progress',
        },
        {
          name: 'Review offences',
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

    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()

    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').should('have.value', '15')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').should('have.value', '12')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').should('have.value', '2023')
    courtCaseWarrantDatePage.continueButton().click()

    const courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the hearing at Accrington Youth Court?',
    )
    courtCaseSelectCourtNamePage.radioLabelSelector('true').click()
    courtCaseSelectCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '15/12/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Review offences',
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

    courtCaseTaskListPage.reviewOffencesLink().click()
    let offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
    const offenceUpdateOutcomePage = Page.verifyOnPage(OffenceUpdateOutcomePage)
    offenceUpdateOutcomePage.radioLabelContains('Remanded in custody').click()
    offenceUpdateOutcomePage.continueButton().click()
    offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.addAnotherButton().click()

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('10')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')
    offenceOutcomePage.radioLabelContains('Remanded in custody').click()
    offenceOutcomePage.continueButton().click()

    offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.radioLabelSelector('true').click()
    offenceReviewOffencesPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Review offences',
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
    courtCaseNextAppearanceAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Completed',
        },
        {
          name: 'Review offences',
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
    // cy.task('verifyNonSentenceCreateCourtCaseRequestFromHmctsData', {
    //   nextAppearanceDate: futureDate.format('YYYY-MM-DD'),
    // }).should('equal', 1)
    cy.task('verifyCreateCourtAppearanceRequest', {
      nextAppearanceDate: futureDate.format('YYYY-MM-DD'),
      courtCaseUuid: '84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b',
      appearanceDate: '2023-12-15',
      documents: [
        {
          documentUUID: 'doc-uuid-1',
          fileName: 'court-document.pdf',
          documentType: 'HMCTS_WARRANT',
          uploadedAt: '2024-06-01T10:00:00Z',
          uploadedBy: 'user1',
          courtDataIngested: true,
        },
      ],
    }).should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Appearance')
  })
})
