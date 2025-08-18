import dayjs from 'dayjs'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
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
import CourtCaseCaseOutcomeAppliedAllPage from '../../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseCheckNextHearingAnswersPage from '../../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextHearingSetPage from '../../pages/courtCaseNextHearingSetPage'
import CourtCaseNextHearingDatePage from '../../pages/courtCaseNextHearingDatePage'
import CourtCaseNextHearingCourtSetPage from '../../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingTypePage from '../../pages/courtCaseNextHearingTypePage'
import CourtCaseConfirmationPage from '../../pages/courtCaseConfirmationPage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import CourtCaseOverallConvictionDatePage from '../../pages/courtCaseOverallConvictionDatePage'
import SentencingWarrantInformationCheckAnswersPage from '../../pages/sentencingWarrantInformationCheckAnswersPage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import OffenceSentenceLengthMismatchPage from '../../pages/offenceSentenceLengthMismatchPage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import SentenceIsSentenceConsecutiveToPage from '../../pages/sentenceIsSentenceConsecutiveToPage'

context('New Court Case journey', () => {
  const futureDate = dayjs().add(10, 'day')
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubCreateCourtCase', { nextHearingDate: futureDate.format('YYYY-MM-DD') })
    cy.task('stubCreateSentenceCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubUploadWarrant')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubOverallSentenceLengthFail')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-12' })
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('fill in remand journey', () => {
    cy.task('stubGetAppearanceOutcomeById', {})
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
    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()

    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Incomplete',
        },
        {
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Add next court appearance',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().should('contain.text', 'Remanded in custody')

    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Warrant type': 'Remand',
      'Case reference': 'T12345678',
      'Warrant date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Overall case outcome': 'Remanded in custody',
      'Is the outcome the same for all offences on the warrant?': 'No',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Incomplete',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
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
    offenceOffenceCodePage.appearanceDetailsSummaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'T12345678',
      'Court name': 'Accrington Youth Court',
      'Warrant date': '13/05/2023',
      'Overall case outcome': 'Remanded in custody',
    })
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')
    offenceOutcomePage.radioLabelContains('Remanded in custody').click()
    offenceOutcomePage.continueButton().click()

    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.addNextCourtAppearanceLink().click()

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
    courtCaseNextHearingAnswersPage
      .summaryList()
      .getSummaryList()
      .should('deep.equal', {
        'Next hearing date': futureDate.format('DD/MM/YYYY'),
        'Next hearing location': 'Accrington Youth Court',
        'Next hearing type': 'Court appearance',
      })
    courtCaseNextHearingAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add appearance information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Add next court appearance',
          status: 'Completed',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.continueButton().click()

    cy.task('verifyCreateCourtCaseRequest', { nextHearingDate: futureDate.format('YYYY-MM-DD') }).should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })

  it('fill in sentencing journey', () => {
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
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
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    const caseRef = 'T12345678'

    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')

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
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Add next court appearance',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type(caseRef)
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Warrant type': 'Sentencing',
      'Case reference': caseRef,
      'Warrant date': '12/05/2023',
      'Court name': 'Accrington Youth Court',
    })
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
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
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
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
    courtCaseOverallSentenceLengthPage.weeksInput().type('3')
    courtCaseOverallSentenceLengthPage.daysInput().type('2')
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

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().should('contain.text', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    const warrantInformationCheckAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    warrantInformationCheckAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 3 weeks 2 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '12/05/2023',
      'Overall case outcome': 'Imprisonment',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
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
          name: 'Add offences',
          status: 'Incomplete',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
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

    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()

    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.continueButton().click()

    const offenceCountNumber = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumber.radioLabelSelector('true').click()
    offenceCountNumber.input().type('1')
    offenceCountNumber.continueButton().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('1')
    offencePeriodLengthPage.monthsInput().type('2')
    offencePeriodLengthPage.weeksInput().type('3')
    offencePeriodLengthPage.daysInput().type('4')
    offencePeriodLengthPage.continueButton().click()

    const sentenceIsConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
    sentenceIsConsecutiveToPage.radioLabelSelector('false').click()
    sentenceIsConsecutiveToPage.continueButton().click()

    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

    const offenceSentenceLengthMismatchPage = Page.verifyOnPage(OffenceSentenceLengthMismatchPage)
    offenceSentenceLengthMismatchPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
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
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Add next court appearance',
          status: 'Optional',
        },
        {
          name: 'Upload court documents',
          status: 'Optional',
        },
      ])
    courtCaseTaskListPage.continueButton().click()

    cy.task('verifyCreateSentenceCourtCaseRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })
})
