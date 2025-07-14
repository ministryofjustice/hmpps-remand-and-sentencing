import SentencingWarrantInformationCheckAnswersPage from '../pages/sentencingWarrantInformationCheckAnswersPage'
import Page from '../pages/page'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseOverallConvictionDatePage from '../pages/courtCaseOverallConvictionDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'

context('Warrant Information Check Answers Page', () => {
  let offenceCheckOverallAnswersPage: SentencingWarrantInformationCheckAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '62412083-9892-48c9-bf01-7864af4a8b3c',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-sentence-length')

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

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().trimTextContent().should('equal', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/check-overall-answers')

    offenceCheckOverallAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
  })

  it('displays person details', () => {
    offenceCheckOverallAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to confirm and continue is displayed', () => {
    offenceCheckOverallAnswersPage.confirmAndContinueButton().should('contain.text', 'Confirm and continue')
  })

  it('displays overall details', () => {
    offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '12/05/2023',
      'Overall case outcome': 'Imprisonment',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })

  it('clicking edit overall sentence length and submitting goes back to check answers page', () => {
    offenceCheckOverallAnswersPage.changeLink('A1234AB', '0', '0', 'sentencing/overall-sentence-length').click()
    const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
    courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
    courtCaseOverallSentenceLengthPage.yearsInput().should('have.value', '4').clear().type('6')

    courtCaseOverallSentenceLengthPage.monthsInput().should('have.value', '5').clear()
    courtCaseOverallSentenceLengthPage.continueButton().click()
    offenceCheckOverallAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '6 years 0 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '12/05/2023',
      'Overall case outcome': 'Imprisonment',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })

  it('clicking edit conviction date and submitting goes back to check answers page', () => {
    offenceCheckOverallAnswersPage.changeLink('A1234AB', '0', '0', 'sentencing/overall-conviction-date').click()
    const courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage.radioLabelSelector('false').click()
    courtCaseOverallConvictionDatePage.continueButton().click()
    offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'No',
      'Overall case outcome': 'Imprisonment',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })

  it('clicking edit overall case outcome and submitting goes back to check answers page', () => {
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d11',
      outcomeName: 'Another option',
      outcomeType: 'SENTENCING',
    })
    offenceCheckOverallAnswersPage.changeLink('A1234AB', '0', '0', 'sentencing/overall-case-outcome').click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Another option').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '12/05/2023',
      'Overall case outcome': 'Another option',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })

  it('after confirm and continue conviction date is no longer editable', () => {
    offenceCheckOverallAnswersPage.confirmAndContinueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/check-overall-answers')
    offenceCheckOverallAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    offenceCheckOverallAnswersPage
      .changeLink('A1234AB', '0', '0', 'sentencing/overall-conviction-date')
      .should('not.exist')
  })

  it('after confirm and continue overall case outcome is no longer editable', () => {
    offenceCheckOverallAnswersPage.confirmAndContinueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/check-overall-answers')
    offenceCheckOverallAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    offenceCheckOverallAnswersPage
      .changeLink('A1234AB', '0', '0', 'sentencing/case-outcome-applied-all')
      .should('not.exist')
  })
})
