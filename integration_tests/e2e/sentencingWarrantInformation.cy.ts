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
  })

  it('displays overall details', () => {
    // offenceCheckOverallAnswersPage.checkOverallAnswersSummaryList().getSummaryList().should('deep.equal', {
    //   'Is there an overall sentence length on the warrant?': 'Yes',
    //   'Overall sentence length': '4 years 5 months 0 weeks 0 days',
    //   'Is the conviction date the same for all offences on the warrant?': 'Yes',
    //   'Conviction date': '12/05/2023',
    //   'Is the outcome the same for all offences on the warrant?': 'Yes',
    // })
  })
})
