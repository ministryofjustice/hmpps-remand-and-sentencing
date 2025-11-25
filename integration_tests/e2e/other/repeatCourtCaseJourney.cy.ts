import dayjs from 'dayjs'
import CourtCaseCaseOutcomeAppliedAllPage from '../../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseCheckNextHearingAnswersPage from '../../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseConfirmationPage from '../../pages/courtCaseConfirmationPage'
import CourtCaseNextHearingCourtSetPage from '../../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingDatePage from '../../pages/courtCaseNextHearingDatePage'
import CourtCaseNextHearingSetPage from '../../pages/courtCaseNextHearingSetPage'
import CourtCaseNextHearingTypePage from '../../pages/courtCaseNextHearingTypePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseSelectCourtNamePage from '../../pages/courtCaseSelectCourtNamePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceReviewOffencesPage from '../../pages/offenceReviewOffencesPage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'
import CourtCaseOverallConvictionDatePage from '../../pages/courtCaseOverallConvictionDatePage'
import OffenceUpdateOutcomePage from '../../pages/offenceUpdateOutcomePage'
import OffenceUpdateOffenceOutcomesPage from '../../pages/offenceUpdateOffenceOutcomesPage'
import SentencingWarrantInformationCheckAnswersPage from '../../pages/sentencingWarrantInformationCheckAnswersPage'
import SentenceIsSentenceConsecutiveToPage from '../../pages/sentenceIsSentenceConsecutiveToPage'

context('Repeat Court Case journey', () => {
  const futureDate = dayjs().add(10, 'day')
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetLatestCourtAppearance', {})
    cy.task('stubCreateCourtAppearance', { nextHearingDate: futureDate.format('YYYY-MM-DD') })
    cy.task('stubCreateSentenceCourtAppearance')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubOverallSentenceLengthPass')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.task('stubGetLatestOffenceDate', {})
    cy.task('stubGetCourtCaseValidationDates', {})
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('repeat remand journey', () => {
    cy.task('stubGetAppearanceTypeByUuid')
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
      outcomeName: 'Remanded in custody',
      outcomeType: 'REMAND',
    })

    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6').click()

    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Incomplete',
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
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()

    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()

    const courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Accrington Youth Court?',
    )
    courtCaseSelectCourtNamePage.radioLabelSelector('true').click()
    courtCaseSelectCourtNamePage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Warrant type': 'Remand',
      'Case reference': 'C894623',
      'Warrant date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
      'Does this outcome apply to all offences on the warrant?': 'Yes',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Review offences',
          status: 'Optional',
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

    courtCaseTaskListPage.reviewOffencesLink().click()
    let offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
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

    offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.radioLabelSelector('true').click()
    offenceReviewOffencesPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
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
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.nextCourtAppearanceLink().click()

    const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    courtCaseNextHearingSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingSetPage.continueButton().click()

    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextHearingTypePage.continueButton().click()

    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type(futureDate.date().toString())
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type((futureDate.month() + 1).toString())
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type(futureDate.year().toString())
    courtCaseNextHearingDatePage.continueButton().click()

    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingCourtSetPage.continueButton().click()

    const courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
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
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.continueButton().click()

    cy.task('verifyCreateCourtAppearanceRequest', { nextHearingDate: futureDate.format('YYYY-MM-DD') }).should(
      'equal',
      1,
    )
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Appearance')
  })

  it('remand to sentencing', () => {
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-05-12',
      offenceDate: '2023-05-12',
    })
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-12' })
    cy.task('stubGetCountNumbersForCourtCase', {})
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6').click()

    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Incomplete',
        },
        {
          name: 'Add overall warrant information',
          status: 'Cannot start yet',
        },
        {
          name: 'Update offence outcomes',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()

    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()

    const courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Accrington Youth Court?',
    )
    courtCaseSelectCourtNamePage.radioLabelSelector('true').click()
    courtCaseSelectCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Warrant type': 'Sentencing',
      'Case reference': 'C894623',
      'Warrant date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add overall warrant information',
          status: 'Incomplete',
        },
        {
          name: 'Update offence outcomes',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.warrantInformationLink().click()

    const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.yearsInput().type('4')
    courtCaseOverallSentenceLengthPage.monthsInput().type('5')
    courtCaseOverallSentenceLengthPage.continueButton().click()

    const courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('12')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('5')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('2023')
    courtCaseOverallConvictionDatePage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Imprisonment').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const warrantInformationCheckAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    warrantInformationCheckAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '12/05/2023',
      'Overall case outcome': 'Imprisonment',
    })
    warrantInformationCheckAnswersPage.confirmAndContinueButton().click()

    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add overall warrant information',
          status: 'Completed',
        },
        {
          name: 'Update offence outcomes',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.updateOffenceOutcomesLink().click()

    let offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
    offenceUpdateOffenceOutcomesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()

    const offenceUpdateOutcomePage = Page.verifyOnPage(OffenceUpdateOutcomePage)
    offenceUpdateOutcomePage.radioLabelContains('Imprisonment').click()
    offenceUpdateOutcomePage.continueButton().click()

    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.continueButton().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.continueButton().click()

    const sentenceIsConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
    sentenceIsConsecutiveToPage.radioLabelSelector('false').click()
    sentenceIsConsecutiveToPage.continueButton().click()

    offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
    offenceUpdateOffenceOutcomesPage.radioLabelSelector('true').click()
    offenceUpdateOffenceOutcomesPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court appearance')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add overall warrant information',
          status: 'Completed',
        },
        {
          name: 'Update offence outcomes',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])

    courtCaseTaskListPage.continueButton().click()

    cy.task('verifyCreateSentenceCourtAppearanceRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Appearance')
  })
})
