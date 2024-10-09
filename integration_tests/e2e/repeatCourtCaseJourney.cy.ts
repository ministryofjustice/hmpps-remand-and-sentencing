import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseConfirmationPage from '../pages/courtCaseConfirmationPage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import CourtCaseSelectReferencePage from '../pages/courtCaseSelectReferencePage'
import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPageEdit from '../pages/offenceCheckOffenceAnswersPageEdit'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceReviewOffencesPage from '../pages/offenceReviewOffencesPage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'
import Page from '../pages/page'
import StartPage from '../pages/startPage'

context('Repeat Court Case journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetLatestCourtAppearance')
    cy.task('stubCreateCourtAppearance')
    cy.task('stubCreateSentenceCourtAppearance')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('repeat remand journey', () => {
    cy.task('stubGetAppearanceOutcomeById', {})
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'remand')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences',
          status: 'Optional',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.button().click()

    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.button().click()

    const courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Accrington Youth Court?',
    )
    courtCaseSelectCourtNamePage.radioLabelSelector('true').click()
    courtCaseSelectCourtNamePage.button().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.button().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.button().click()

    const courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
    courtCaseTaggedBailPage.radioLabelSelector('true').click()
    courtCaseTaggedBailPage.input().type('5')
    courtCaseTaggedBailPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '12 05 2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
      'Outcome applies to all offences': 'Yes',
      'Tagged bail': '5 days',
    })
    courtCaseCheckAnswersPage.button().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'remand')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences',
          status: 'Optional',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
      ])

    // courtCaseTaskListPage.courtDocumentsLink().click()

    // const courtCaseDocumentTypePage = Page.verifyOnPage(CourtCaseDocumentTypePage) - not built yet
    // courtCaseDocumentTypePage.radioLabelSelector('Custodial warrant').click()
    // courtCaseDocumentTypePage.button().click()

    // const courtCaseWarrantUploadPage = Page.verifyOnPage(CourtCaseWarrantUploadPage)
    // courtCaseWarrantUploadPage.fileInput().selectFile('integration_tests/resources/aWarrant.jpg')
    // courtCaseWarrantUploadPage.button().click()

    // const courtCaseDocumentsPage = Page.verifyOnPage(CourtCaseDocumentsPage) - not built yet
    // courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
    //   'Custodial warrant 1': 'uploaded',
    // })
    // courtCaseDocumentsPage.button().click()

    // courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage) - not built yet
    courtCaseTaskListPage.reviewOffencesLink().click()
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.radioLabelSelector('true').click()
    offenceReviewOffencesPage.button().click()

    let offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPageEdit, 'offence')
    offenceCheckOffenceAnswersPage.addAnotherButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()

    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioLabelSelector('true').click()
    offenceTerrorRelatedPage.button().click()

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.button().click()

    offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPageEdit, 'offence')
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'remand')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences',
          status: 'Completed',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.addNextCourtAppearanceLink().click()

    const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    courtCaseNextHearingSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingSetPage.button().click()

    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelSelector('Court appearance').click()
    courtCaseNextHearingTypePage.button().click()

    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type('18')
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type('10')
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type('2023')
    courtCaseNextHearingDatePage.button().click()

    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingCourtSetPage.button().click()

    const courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage.button().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'remand')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences',
          status: 'Completed',
        },
        {
          name: 'Add next court appearance',
          status: 'Completed',
        },
      ])

    courtCaseTaskListPage.button().click()

    cy.task('verifyCreateCourtAppearanceRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Appearance')
  })

  it('remand to sentencing journey', () => {
    cy.task('stubGetSentenceTypesByIds')
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])

    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment by default',
        outcomeType: 'SENTENCING',
      },
    ])
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'sentencing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences and sentences',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.button().click()

    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.button().click()

    const courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Accrington Youth Court?',
    )
    courtCaseSelectCourtNamePage.radioLabelSelector('true').click()
    courtCaseSelectCourtNamePage.button().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    courtCaseOverallCaseOutcomePage.radioLabelContains('Imprisonment').click()
    courtCaseOverallCaseOutcomePage.button().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.button().click()

    const courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
    courtCaseTaggedBailPage.radioLabelSelector('true').click()
    courtCaseTaggedBailPage.input().type('5')
    courtCaseTaggedBailPage.button().click()

    const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage.yearsInput().type('4')
    courtCaseOverallSentenceLengthPage.monthsInput().type('5')
    courtCaseOverallSentenceLengthPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Warrant date': '12 05 2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Imprisonment',
      'Outcome applies to all offences': 'Yes',
      'Tagged bail': '5 days',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
    })
    courtCaseCheckAnswersPage.button().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'sentencing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences and sentences',
          status: 'Incomplete',
        },
      ])

    // courtCaseTaskListPage.courtDocumentsLink().click()

    // const courtCaseDocumentTypePage = Page.verifyOnPage(CourtCaseDocumentTypePage) - not built yet
    // courtCaseDocumentTypePage.radioLabelSelector('Custodial warrant').click()
    // courtCaseDocumentTypePage.button().click()

    // const courtCaseWarrantUploadPage = Page.verifyOnPage(CourtCaseWarrantUploadPage)
    // courtCaseWarrantUploadPage.fileInput().selectFile('integration_tests/resources/aWarrant.jpg')
    // courtCaseWarrantUploadPage.button().click()

    // const courtCaseDocumentsPage = Page.verifyOnPage(CourtCaseDocumentsPage) - not built yet
    // courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
    //   'Custodial warrant 1': 'uploaded',
    // })
    // courtCaseDocumentsPage.button().click()

    // courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage) - not built yet
    courtCaseTaskListPage.reviewOffencesLink().click()
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.radioLabelSelector('true').click()
    offenceReviewOffencesPage.button().click()

    let offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPageEdit, 'sentence')
    offenceCheckOffenceAnswersPage.addAnotherButton().click()

    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.button().click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.button().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()

    const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    offenceTerrorRelatedPage.radioLabelSelector('true').click()
    offenceTerrorRelatedPage.button().click()

    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.button().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.button().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.button().click()

    const cffenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    cffenceSentenceServeTypePage.radioLabelSelector('FORTHWITH').click()
    cffenceSentenceServeTypePage.button().click()

    offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPageEdit, 'sentence')
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'sentencing')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
        {
          name: 'Review offences and sentences',
          status: 'Completed',
        },
      ])

    courtCaseTaskListPage.button().click()

    cy.task('verifyCreateSentenceCourtAppearanceRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Appearance')
  })
})
