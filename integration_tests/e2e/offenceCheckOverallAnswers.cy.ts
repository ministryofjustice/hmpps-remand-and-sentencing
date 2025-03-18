import OffenceCheckOverallAnswersPage from '../pages/offenceCheckOverallAnswersPage'
import Page from '../pages/page'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseOverallConvictionDatePage from '../pages/courtCaseOverallConvictionDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'

context('Offence Check Overall Answers Page', () => {
  let offenceCheckOverallAnswersPage: OffenceCheckOverallAnswersPage
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

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-sentence-length')

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

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-overall-answers')

    offenceCheckOverallAnswersPage = Page.verifyOnPage(OffenceCheckOverallAnswersPage)
  })

  it('displays person details', () => {
    offenceCheckOverallAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to confirm and add offences is displayed', () => {
    offenceCheckOverallAnswersPage.confirmAndAddOffenceButton().should('contain.text', 'Confirm and add offences')
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
})
