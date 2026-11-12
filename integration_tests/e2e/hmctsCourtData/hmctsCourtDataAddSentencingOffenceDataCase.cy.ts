import dayjs from 'dayjs'
import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseConfirmationPage from '../../pages/courtCaseConfirmationPage'
import HmctsCourtDataLandingPage from '../../pages/hmctsCourtDataLandingPage'
import SentencingWarrantInformationCheckAnswersPage from '../../pages/sentencingWarrantInformationCheckAnswersPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import SentenceConsecutiveToPage from '../../pages/sentenceSentenceConsecutiveToPage'

context('New Sentencing Court Case from hmcts data journey', () => {
  const hearingId = 'abf395c2-8e3c-419c-bd9c-71d544e5d811'
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
    cy.task('stubHmctsSentencingCourtData')
    cy.task('stubCreateCourtCase')
    cy.task('stubUploadDocument')
    cy.task('stubOverallSentenceLengthFail')
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-12-15' })
    cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-12-15' })
    cy.task('stubHasLoopInChain')
    cy.task('stubGetCourtHearing')
    cy.task('stubDocumentViewed')
    cy.signIn()
    cy.visit(`/person/A1234AB/review-new-documents/${hearingId}/landing`)
  })

  it('fill in sentencing journey from hmcts court data', () => {
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetAppearanceTypeByUuid')
    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-12-15',
      offenceDate: '2022-07-04',
      age: '58',
    })
    const landingPage = Page.verifyOnPageTitle(HmctsCourtDataLandingPage, 'Review new documents and add a court case')
    landingPage
      .commonPlatformText()
      .should('contain.text', 'A new sentencing warrant for C894623 has been added from Common Platform.')
    landingPage.continueButton().click()

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
          name: 'Add overall warrant information',
          status: 'Cannot start yet',
        },
        {
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Add aggravating factors',
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
    courtCaseWarrantDatePage.dayDateInput('warrantDate').should('have.value', '15')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').should('have.value', '12')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').should('have.value', '2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().should('have.value', 'Accrington Youth Court')
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Warrant type': 'Sentencing',
      'Case reference': 'C894623',
      'Warrant date': '15/12/2023',
      'Court name': 'Accrington Youth Court',
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
          name: 'Add overall warrant information',
          status: 'Incomplete',
        },
        {
          name: 'Add offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Add aggravating factors',
          status: 'Cannot start yet',
        },
        {
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.warrantInformationLink().click()

    const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage.radioSelector('true').should('be.checked')
    courtCaseOverallSentenceLengthPage.yearsInput().should('be.empty')
    courtCaseOverallSentenceLengthPage.monthsInput().should('have.value', '2')
    courtCaseOverallSentenceLengthPage.weeksInput().should('be.empty')
    courtCaseOverallSentenceLengthPage.daysInput().should('be.empty')
    courtCaseOverallSentenceLengthPage.continueButton().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallSentenceLengthPage
      .radioSelector('62412083-9892-48c9-bf01-7864af4a8b3c|f17328cf-ceaa-43c2-930a-26cf74480e18')
      .should('be.checked')
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const warrantInformationCheckAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    warrantInformationCheckAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '0 years 2 months 0 weeks 0 days',
      'Conviction date': '15/12/2023',
      'Overall case outcome': 'Imprisonment',
    })
    warrantInformationCheckAnswersPage.confirmAndContinueButton().click()
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
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
          name: 'Add aggravating factors',
          status: 'Cannot start yet',
        },
        {
          name: 'Review court documents',
          status: '1 document uploaded',
        },
      ])
    courtCaseTaskListPage.offencesLink().click()

    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')

    const expectedCustodialSummary: Record<string, string> = {
      'Committed on': '04/07/2022',
      'Conviction date': '15/12/2023',
      Outcome: 'Imprisonment',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '0 years 2 months 0 weeks 0 days',
      'Consecutive or concurrent': 'Forthwith',
    }
    offenceCheckOffenceAnswersPage.custodialOffences().getSummaryList().should('deep.equal', expectedCustodialSummary)

    const expectedOffencesToReviewSummary: Record<string, string> = {
      'Committed on': '04/07/2022',
      'Consecutive or concurrent': 'Consecutive',
      Outcome: 'Imprisonment',
    }
    offenceCheckOffenceAnswersPage
      .offencesToReview()
      .getSummaryList()
      .should('deep.equal', expectedOffencesToReviewSummary)

    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    offenceCheckOffenceAnswersPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must update offences with missing information')

    const missingOutcomeChargeId = 'afa047e8-cbcd-4f57-ae7f-88cffca94fae'
    offenceCheckOffenceAnswersPage.missingInformationLink(missingOutcomeChargeId).click()

    let editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.editFieldLink(missingOutcomeChargeId, 'offence-outcome').click()

    const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
    offenceOffenceOutcomePage.continueButton().click()

    editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.continueButton().click()

    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')
    const expectedNonCustodialSummary: Record<string, string> = {
      'Committed on': '04/07/2022',
      Outcome: 'Lie on file',
    }
    offenceCheckOffenceAnswersPage
      .nonCustodialOffences()
      .getSummaryList()
      .should('deep.equal', expectedNonCustodialSummary)

    const missingSentenceInfoChargeId = 'e15b62d4-1ae9-417d-b442-5c7b768d4d6d'
    offenceCheckOffenceAnswersPage.missingInformationLink(missingSentenceInfoChargeId).click()

    editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.editFieldLink(missingSentenceInfoChargeId, 'conviction-date').click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').type('15')
    offenceConvictionDatePage.monthDateInput('convictionDate').type('12')
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()

    editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.updateSentencetypeCta().click()

    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').click()
    offenceSentenceTypePage.continueButton().click()

    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('1')
    offencePeriodLengthPage.monthsInput().type('2')
    offencePeriodLengthPage.weeksInput().type('3')
    offencePeriodLengthPage.daysInput().type('4')
    offencePeriodLengthPage.continueButton().click()

    editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.editFieldLink(missingSentenceInfoChargeId, 'consecutive-to').click()

    const sentenceConsecutiveToPage = Page.verifyOnPageTitle(SentenceConsecutiveToPage, 'sentence length')
    sentenceConsecutiveToPage.radioSelector('f092b4ee-80dc-4acf-9813-43f45665119e').click()
    sentenceConsecutiveToPage.continueButton().click()
    editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    editOffencePage.continueButton().click()

    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()

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
          name: 'Add overall warrant information',
          status: 'Completed',
        },
        {
          name: 'Add offences',
          status: 'Completed',
        },
        {
          name: 'Add aggravating factors',
          status: 'Optional',
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
    cy.task('verifySentenceCreateCourtCaseRequestFromHmctsData', {
      nextAppearanceDate: futureDate.format('YYYY-MM-DD'),
    }).should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })
})
