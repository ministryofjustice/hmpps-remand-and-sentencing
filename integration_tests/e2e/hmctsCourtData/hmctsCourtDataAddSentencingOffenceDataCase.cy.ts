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
    cy.task('stubGetAppearanceTypeByUuid')
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

    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')

    const expectedSummary: Record<string, string> = {
      'Committed on': '04/07/2022',
      'Conviction date': '15/12/2023',
      Outcome: 'Imprisonment',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '0 years 2 months 0 weeks 0 days',
      'Consecutive or concurrent': 'Forthwith',
    }
    offenceCheckOffenceAnswersPage.custodialOffences().getSummaryList().should('deep.equal', expectedSummary)
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
