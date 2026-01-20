import OffenceAlternativePeriodLengthPage from '../../pages/offenceAlternativePeriodLengthPage'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import Page from '../../pages/page'

context('Unknown recall sentence alternative period length', () => {
  let offenceAlternativePeriodLengthPage: OffenceAlternativePeriodLengthPage
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
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()
    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()
    const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    offencePeriodLengthPage.alternativePeriodLengthLink().click()
    offenceAlternativePeriodLengthPage = Page.verifyOnPageTitle(OffenceAlternativePeriodLengthPage, 'sentence length')
  })

  it('cancel button should not be visible', () => {
    offenceAlternativePeriodLengthPage.cancelButton().should('not.exist')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage = Page.verifyOnPageTitle(OffenceAlternativePeriodLengthPage, 'sentence length')
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    offenceAlternativePeriodLengthPage.sentenceLengthInput('first').type('2.5')
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage = Page.verifyOnPageTitle(OffenceAlternativePeriodLengthPage, 'sentence length')
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    offenceAlternativePeriodLengthPage.sentenceLengthInput('first').type('0')
    offenceAlternativePeriodLengthPage.sentenceLengthInput('second').type('0')
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage = Page.verifyOnPageTitle(OffenceAlternativePeriodLengthPage, 'sentence length')
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })
})
