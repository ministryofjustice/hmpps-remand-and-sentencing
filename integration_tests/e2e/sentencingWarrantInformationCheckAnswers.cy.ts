import SentencingWarrantInformationCheckAnswersPage from '../pages/sentencingWarrantInformationCheckAnswersPage'
import Page from '../pages/page'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseOverallConvictionDatePage from '../pages/courtCaseOverallConvictionDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'

context('Warrant Information Check Answers Page', () => {
  let offenceCheckOverallAnswersPage: SentencingWarrantInformationCheckAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomesWithSingleResults')
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-case-outcome')

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().trimTextContent().should('equal', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

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
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })

  it('clicking edit conviction date and submitting goes back to check answers page', () => {
    offenceCheckOverallAnswersPage.changeLink('A1234AB', '0', '0', 'sentencing/overall-conviction-date').click()
    const courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage
      .dayDateInput('overallConvictionDate')
      .should('have.value', '12')
      .clear()
      .type('20')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').should('have.value', '5')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').should('have.value', '2023')
    courtCaseOverallConvictionDatePage.continueButton().click()
    offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
      'Is there an overall sentence length on the warrant?': 'Yes',
      'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      'Is the conviction date the same for all offences on the warrant?': 'Yes',
      'Conviction date': '20/05/2023',
      'Is the outcome the same for all offences on the warrant?': 'Yes',
    })
  })
})
