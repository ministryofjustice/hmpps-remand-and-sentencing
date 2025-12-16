import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import OffenceFineAmountPage from '../../pages/offenceFineAmountPage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import Page from '../../pages/page'
import UnknownRecallSentenceCheckAnswersPage from '../../pages/unknownRecallSentenceCheckAnswersPage'

context('Unknown recall sentence check answers', () => {
  let unknownRecallSentenceCheckAnswersPage: UnknownRecallSentenceCheckAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetUnknownRecallSentenceAppearanceDetails')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/load-charge',
    )
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('10')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()
    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.yearsInput().type('1')
    offencePeriodLengthPage.monthsInput().type('2')
    offencePeriodLengthPage.continueButton().click()
    unknownRecallSentenceCheckAnswersPage = Page.verifyOnPage(UnknownRecallSentenceCheckAnswersPage)
  })

  it('displays correct values', () => {
    unknownRecallSentenceCheckAnswersPage.answersSummaryList().getSummaryList().should('deep.equal', {
      'Committed on': '10/05/2023',
      'Conviction date': '12/05/2023',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '1 years 2 months 0 weeks 0 days',
    })
  })

  it('can edit offence date and return back to check answers', () => {
    unknownRecallSentenceCheckAnswersPage.offenceDateLink().click()
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('8')
    offenceOffenceDatePage.continueButton().click()
    unknownRecallSentenceCheckAnswersPage = Page.verifyOnPage(UnknownRecallSentenceCheckAnswersPage)
    unknownRecallSentenceCheckAnswersPage.answersSummaryList().getSummaryList().should('deep.equal', {
      'Committed on': '08/05/2023',
      'Conviction date': '12/05/2023',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '1 years 2 months 0 weeks 0 days',
    })
  })

  it('can edit conviction date and return back to check answers', () => {
    unknownRecallSentenceCheckAnswersPage.convictionDateLink().click()
    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('11')
    offenceConvictionDatePage.continueButton().click()
    unknownRecallSentenceCheckAnswersPage = Page.verifyOnPage(UnknownRecallSentenceCheckAnswersPage)
    unknownRecallSentenceCheckAnswersPage.answersSummaryList().getSummaryList().should('deep.equal', {
      'Committed on': '10/05/2023',
      'Conviction date': '11/05/2023',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '1 years 2 months 0 weeks 0 days',
    })
  })

  it('can edit sentence type and return back to check answers', () => {
    cy.task('stubGetSentenceTypeById', {
      sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
      description: 'Imprisonment in Default of Fine',
      classification: 'FINE',
    })
    unknownRecallSentenceCheckAnswersPage.sentenceTypeLink().click()
    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('Imprisonment in Default of Fine').click()
    offenceSentenceTypePage.continueButton().click()
    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'term length')
    offencePeriodLengthPage.yearsInput().type('1')
    offencePeriodLengthPage.continueButton().click()
    const offenceFineAmountPage = Page.verifyOnPage(OffenceFineAmountPage)
    offenceFineAmountPage.input().type('10')
    offenceFineAmountPage.continueButton().click()
    unknownRecallSentenceCheckAnswersPage = Page.verifyOnPage(UnknownRecallSentenceCheckAnswersPage)
    unknownRecallSentenceCheckAnswersPage.answersSummaryList().getSummaryList().should('deep.equal', {
      'Committed on': '10/05/2023',
      'Conviction date': '12/05/2023',
      'Sentence type': 'Imprisonment in Default of Fine',
      'Term length': '1 years 0 months 0 weeks 0 days',
      'Fine Amount': '£10',
    })
  })

  it('can edit period length and return back to check answers', () => {
    unknownRecallSentenceCheckAnswersPage.periodLengthLink('SENTENCE_LENGTH').click()
    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.monthsInput().clear().type('6')
    offencePeriodLengthPage.continueButton().click()
    unknownRecallSentenceCheckAnswersPage = Page.verifyOnPage(UnknownRecallSentenceCheckAnswersPage)
    unknownRecallSentenceCheckAnswersPage.answersSummaryList().getSummaryList().should('deep.equal', {
      'Committed on': '10/05/2023',
      'Conviction date': '12/05/2023',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '1 years 6 months 0 weeks 0 days',
    })
  })
})
