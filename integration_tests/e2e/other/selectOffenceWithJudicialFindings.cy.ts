import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import SelectOffenceWithJudicialFindingsPage from '../../pages/SelectOffenceWithJudicialFindingsPage'

context('Select offence with judicial findings Page', () => {
  let selectOffenceWithJudicialFindingsPage: SelectOffenceWithJudicialFindingsPage

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

    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    const offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(
      OffenceCheckOffenceAnswersPage,
      'You have added 1 offence',
    )
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.judicialFindingsLink().click()
    selectOffenceWithJudicialFindingsPage = Page.verifyOnPage(SelectOffenceWithJudicialFindingsPage)
  })

  it('shows sentenced offences', () => {
    selectOffenceWithJudicialFindingsPage
      .checkboxes()
      .getOffenceCheckboxOptions()
      .should('deep.equal', [
        {
          countNumber: 'Count 1',
          offence: 'PS90037 - An offence description',
          offenceDate: 'Committed on 12/05/2023',
        },
      ])
  })

  it('shows error when no checkboxes selected', () => {
    selectOffenceWithJudicialFindingsPage.continueButton().click()
    selectOffenceWithJudicialFindingsPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select at least one offence to apply judicial findings to')
  })
})
