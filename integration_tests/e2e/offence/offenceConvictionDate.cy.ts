import dayjs from 'dayjs'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import Page from '../../pages/page'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import SentenceIsSentenceConsecutiveToPage from '../../pages/sentenceIsSentenceConsecutiveToPage'
import StartPage from '../../pages/startPage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseOverallConvictionDatePage from '../../pages/courtCaseOverallConvictionDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../../pages/courtCaseCaseOutcomeAppliedAllPage'
import SentencingWarrantInformationCheckAnswersPage from '../../pages/sentencingWarrantInformationCheckAnswersPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'

context('Add Offence Conviction Date Page', () => {
  let offenceConvictionDatePage: OffenceConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Conviction date must include day Conviction date must include month Conviction date must include year',
      )
  })

  it('Conviction date cannot be in the future and must be within 100 years', () => {
    const futureDate = dayjs().add(7, 'day')
    offenceConvictionDatePage.dayDateInput('convictionDate').type(futureDate.date().toString())
    offenceConvictionDatePage.monthDateInput('convictionDate').type((futureDate.month() + 1).toString())
    offenceConvictionDatePage.yearDateInput('convictionDate').type(futureDate.year().toString())
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date cannot be a date in the future')

    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('01')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('01')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('1899')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })

  it('submitting an  invalid conviction date results in an error', () => {
    offenceConvictionDatePage.dayDateInput('convictionDate').type('35')
    offenceConvictionDatePage.monthDateInput('convictionDate').type('1')
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2024')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('Conviction date must be after the warrant date', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('08')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('07')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('09')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('07')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2025')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be on or before the warrant date')
  })

  it('Conviction date must be after offence start and end dates', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('16')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('15')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('08')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be after the offence start date')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('20')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('19')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('08')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The conviction date must be after the offence start date and offence end date',
      )
  })
})

context('Add Offence Conviction Date Page tests with a full create court appearance', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-12' })
    cy.visit('/person/A1234AB')
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

    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-05-11',
      offenceDate: '2023-05-10',
    })
    cy.task('stubIsSentenceTypeStillValid', {})
  })
  it('create court appearance, enter the conviction date, check answers and re-edit again', () => {
    const caseRef = 'T12345678'

    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    let courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
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
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.continueButton().click()

    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.warrantInformationLink().click()

    const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage.radioLabelSelector('false').click()
    courtCaseOverallSentenceLengthPage.continueButton().click()

    const courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage.radioLabelSelector('false').click()
    courtCaseOverallConvictionDatePage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Imprisonment').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    const warrantInformationCheckAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    warrantInformationCheckAnswersPage.confirmAndContinueButton().click()

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
    offenceCountNumber.radioLabelSelector('false').click()
    offenceCountNumber.continueButton().click()

    const offenceConvictionDatePage: OffenceConvictionDatePage = Page.verifyOnPageTitle(
      OffenceConvictionDatePage,
      'Enter the conviction date',
    )
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('11')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('05')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('1')
    offencePeriodLengthPage.continueButton().click()

    const sentenceIsConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
    sentenceIsConsecutiveToPage.radioLabelSelector('false').click()
    sentenceIsConsecutiveToPage.continueButton().click()

    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage.editOffenceLink('0').click()
    const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editFieldLink('0', 'conviction-date').click()
    offenceConvictionDatePage.continueButton().click()

    // RASS-1214 bug fix tested by this - previously an error message was being shown
    Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
  })
})
