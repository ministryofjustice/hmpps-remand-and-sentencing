import Page from '../pages/page'
import StartPage from '../pages/startPage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'

context('New Court Case journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode')
    cy.task('stubCreateCourtCase')
    cy.task('stubCreateSentenceCourtCase')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes')
    cy.task('stubUploadWarrant')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('fill in remand journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()

    let courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage)
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('1234')
    courtCaseReferencePage.button().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrant-date').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrant-date').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrant-date').type('2023')
    courtCaseWarrantDatePage.button().click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()

    const courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
    courtCaseTaggedBailPage.radioLabelSelector('true').click()
    courtCaseTaggedBailPage.input().type('5')
    courtCaseTaggedBailPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    // courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', { - sort this once the check answers ticket is done
    //   'Court case reference': '1234',
    //   'Warrant date': '12 05 2023',
    //   'Court name': 'Bradford Crown Court',
    //   'Tagged bail': '5',
    // })
    courtCaseCheckAnswersPage.button().click()

    courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage)
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
    // courtCaseTaskListPage.offencesLink().click()

    // let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '1234', 'offences')
    // offenceCheckOffenceAnswersPage.AddAnOffenceButton().click()

    // const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    // offenceOffenceCodePage.input().type('PS90037')
    // offenceOffenceCodePage.button().click()

    // const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    // offenceOffenceCodeConfirmPage.button().click()

    // const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    // offenceOffenceDatePage.dayDateInput('offence-start-date').type('12')
    // offenceOffenceDatePage.monthDateInput('offence-start-date').type('5')
    // offenceOffenceDatePage.yearDateInput('offence-start-date').type('2023')
    // offenceOffenceDatePage.button().click()

    // const offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
    // offenceOffenceOutcomePage.radioLabelSelector('Remand in Custody (Bail Refused)').click()
    // offenceOffenceOutcomePage.button().click()

    // offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '1234', 'offences')
    // offenceCheckOffenceAnswersPage.radioLabelSelector('Yes, I’ve finished adding offences').click()
    // offenceCheckOffenceAnswersPage.button().click()

    // courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage) - not built yet
    // courtCaseTaskListPage.nextCourtAppearanceLink().click()

    // const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    // courtCaseNextHearingSetPage.radioLabelSelector('true').click()
    // courtCaseNextHearingSetPage.button().click()

    // const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    // courtCaseNextHearingTypePage.radioLabelSelector('Court appearance').click()
    // courtCaseNextHearingTypePage.button().click()

    // const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    // courtCaseNextHearingDatePage.dayDateInput('next-hearing-date').type('18')
    // courtCaseNextHearingDatePage.monthDateInput('next-hearing-date').type('10')
    // courtCaseNextHearingDatePage.yearDateInput('next-hearing-date').type('2023')
    // courtCaseNextHearingDatePage.button().click()

    // const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    // courtCaseNextHearingCourtSetPage.radioLabelSelector('true').click()
    // courtCaseNextHearingCourtSetPage.button().click()

    // const courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    // courtCaseNextHearingAnswersPage.button().click()

    // courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage) - not built yet
    // courtCaseTaskListPage.finishAndSave().click()

    // cy.task('verifyCreateCourtCaseRequest').should('equal', 1)
    // once confirmation page is implemented it will go to that page

    // prototype still being updated, assume this will be somewhere
    // const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    // courtCaseOverallCaseOutcomePage.radioLabelSelector('Remand in Custody (Bail Refused)').click()
    // courtCaseOverallCaseOutcomePage.button().click()

    // const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    // courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    // courtCaseCaseOutcomeAppliedAllPage.button().click()
  })

  it('fill in sentencing journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.actionListLink().click()

    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()

    let courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage)
    courtCaseTaskListPage.appearanceInformationLink().click()

    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('1234')
    courtCaseReferencePage.button().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrant-date').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrant-date').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrant-date').type('2023')
    courtCaseWarrantDatePage.button().click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()

    const courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
    courtCaseTaggedBailPage.radioLabelSelector('true').click()
    courtCaseTaggedBailPage.input().type('5')
    courtCaseTaggedBailPage.button().click()

    // const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    // courtCaseOverallSentenceLengthPage.yearsInput().type('4')
    // courtCaseOverallSentenceLengthPage.monthsInput().type('5')
    // courtCaseOverallSentenceLengthPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    // courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
    //   'warrant type': 'Sentencing',
    //   'Case reference': '1234',
    //   'Warrant date': '12 05 2023',
    //   'Court name': 'Bradford Crown Court',
    //   'Tagged bail': '5',
    //   'Overall sentence length': '4 years 5 months',
    // })
    courtCaseCheckAnswersPage.button().click()

    courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage)
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
    // courtCaseTaskListPage.sentencesLink().click()

    // const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    // offenceCountNumberPage.input().type('1')
    // offenceCountNumberPage.button().click()

    // const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    // offenceOffenceCodePage.input().type('PS90037')
    // offenceOffenceCodePage.button().click()

    // const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    // offenceOffenceCodeConfirmPage.button().click()

    // const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
    // offenceTerrorRelatedPage.radioLabelSelector('true').click()
    // offenceTerrorRelatedPage.button().click()

    // const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    // offenceOffenceDatePage.dayDateInput('offence-start-date').type('12')
    // offenceOffenceDatePage.monthDateInput('offence-start-date').type('5')
    // offenceOffenceDatePage.yearDateInput('offence-start-date').type('2023')
    // offenceOffenceDatePage.button().click()

    // const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    // offenceSentenceTypePage.radioLabelSelector('SDS (Standard Determinate Sentence)').click()
    // offenceSentenceTypePage.button().click()

    // const offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
    // offenceSentenceLengthPage.yearsInput().type('4')
    // offenceSentenceLengthPage.monthsInput().type('5')
    // offenceSentenceLengthPage.button().click()

    // const offenceConsecutiveConcurrentPage = Page.verifyOnPage(OffenceConsecutiveConcurrentPage)
    // offenceConsecutiveConcurrentPage.radioLabelSelector('Forthwith').click()
    // offenceConsecutiveConcurrentPage.button().click()

    // const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '1234', 'sentences')
    // offenceCheckOffenceAnswersPage.finishAddingButton().click()

    // courtCaseTaskListPage = Page.verifyOnPage(CourtCaseTaskListPage) - not built yet
    // courtCaseTaskListPage.button().click()

    // cy.task('verifyCreateSentenceCourtCaseRequest').should('equal', 1)
    // once confirmation page is implemented it will go to that page
  })
})
