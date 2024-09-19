import Page from '../pages/page'
import StartPage from '../pages/startPage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseConfirmationPage from '../pages/courtCaseConfirmationPage'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'

context('New Court Case journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubCreateCourtCase')
    cy.task('stubCreateSentenceCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubUploadWarrant')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('fill in remand journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

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
          name: 'Add Offences',
          status: 'Cannot start yet',
        },
        {
          name: 'Next court appearance',
          status: 'Incomplete',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.button().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.button().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    courtCaseOverallCaseOutcomePage.radioLabelSelector('Remanded in custody').click()
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
      'Case reference': 'T12345678',
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
          name: 'Add Offences',
          status: 'Incomplete',
        },
        {
          name: 'Next court appearance',
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
    courtCaseTaskListPage.offencesLink().click()

    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'offences')
    offenceCheckOffenceAnswersPage.addAnotherButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.appearanceDetailsSummaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'T12345678',
      'Court name': 'Accrington Youth Court',
      'Warrant date': '12 05 2023',
    })
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

    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
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
          name: 'Add Offences',
          status: 'Completed',
        },
        {
          name: 'Next court appearance',
          status: 'Incomplete',
        },
      ])
    courtCaseTaskListPage.nextCourtAppearanceLink().click()

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
    courtCaseNextHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Next hearing date': '18 10 2023',
      'Next hearing location': 'Accrington Youth Court',
      'Next hearing type': 'Court appearance',
    })
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
          name: 'Add Offences',
          status: 'Completed',
        },
        {
          name: 'Next court appearance',
          status: 'Completed',
        },
      ])
    courtCaseTaskListPage.button().click()

    cy.task('verifyCreateCourtCaseRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })

  it('fill in sentencing journey', () => {
    cy.task('stubGetSentenceTypesByIds')
    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

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
          name: 'Add Sentences',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.button().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.button().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()

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
      'Case reference': 'T12345678',
      'Warrant date': '12 05 2023',
      'Court name': 'Accrington Youth Court',
      'Tagged bail': '5 days',
      'Overall sentence length': '4 years 5 months',
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
          name: 'Add Sentences',
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
    courtCaseTaskListPage.sentencesLink().click()

    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'sentences')
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

    const offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
    offencePeriodLengthPage.yearsInput().type('4')
    offencePeriodLengthPage.monthsInput().type('5')
    offencePeriodLengthPage.button().click()

    const cffenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    cffenceSentenceServeTypePage.radioLabelSelector('FORTHWITH').click()
    cffenceSentenceServeTypePage.button().click()

    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'sentences')
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
          name: 'Add Sentences',
          status: 'Completed',
        },
      ])
    courtCaseTaskListPage.button().click()

    cy.task('verifyCreateSentenceCourtCaseRequest').should('equal', 1)
    Page.verifyOnPageTitle(CourtCaseConfirmationPage, 'Court case')
  })
})
