import CheckJudicialFindingsAnswersPage from '../../pages/CheckJudicialFindingsAnswersPage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import DeleteJudicialFindingsOffencePage from '../../pages/DeleteJudicialFindingsOffencePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import SelectOffenceWithJudicialFindingsPage from '../../pages/SelectOffenceWithJudicialFindingsPage'

context('Select offence with judicial findings Page', () => {
  let checkJudicialFindingsAnswersPage: CheckJudicialFindingsAnswersPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('14')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-case-outcome')
    const overallOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    overallOutcomePage.radioLabelContains('Imprisonment').click()
    overallOutcomePage.continueButton().click()
    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPageSentencing)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().trimTextContent().should('equal', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')

    cy.createSentencedOffence('A1234AB', '0', '0', '0', '1')
    cy.createSentencedConcurrentOffence('A1234AB', '0', '0', '0', '2')
    const offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(
      OffenceCheckOffenceAnswersPage,
      'You have added 2 offence',
    )
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.judicialFindingsLink().click()
    const selectOffenceWithJudicialFindingsPage = Page.verifyOnPage(SelectOffenceWithJudicialFindingsPage)
    selectOffenceWithJudicialFindingsPage.checkbox(1).click()
    selectOffenceWithJudicialFindingsPage.continueButton().click()
    checkJudicialFindingsAnswersPage = Page.verifyOnPage(CheckJudicialFindingsAnswersPage)
  })

  it('shows offences with judicial findings', () => {
    checkJudicialFindingsAnswersPage
      .pageContent()
      .getSummaryCardLists()
      .should('deep.equal', [
        {
          cardTitle: 'PS90037 An offence description',
          'Count number': '2',
          'Committed on': '10/05/2023',
          'Judicial findings': 'Finding of domestic abuse',
        },
      ])
  })

  it('clicking continue without selecting an option rules in an error', () => {
    checkJudicialFindingsAnswersPage.continueButton().click()
    checkJudicialFindingsAnswersPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select whether you have finished adding judicial findings')
  })

  it('deleting only selected judicial findings offence results in empty state', () => {
    checkJudicialFindingsAnswersPage.deleteOffenceLink(0).click()
    const deleteJudicialFindingsOffencePage = Page.verifyOnPage(DeleteJudicialFindingsOffencePage)
    deleteJudicialFindingsOffencePage.deleteButton().click()
    checkJudicialFindingsAnswersPage
      .noJudicialFindingsInset()
      .should('contain.text', 'No judicial findings have been added.')
    checkJudicialFindingsAnswersPage.continueButton().should('not.exist')
  })

  it('selecting all offences disabled the button', () => {
    checkJudicialFindingsAnswersPage.selectAnotherOffenceButton().click()
    const selectOffenceWithJudicialFindingsPage = Page.verifyOnPage(SelectOffenceWithJudicialFindingsPage)
    selectOffenceWithJudicialFindingsPage.checkbox(0).click()
    selectOffenceWithJudicialFindingsPage.continueButton().click()
    checkJudicialFindingsAnswersPage.selectAnotherOffenceButton().should('have.attr', 'disabled')
  })
})
