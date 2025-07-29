import OffenceAlternativePeriodLengthPage from '../../pages/offenceAlternativePeriodLengthPage'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import Page from '../../pages/page'

context('Add Offence Alternative Period Length Page', () => {
  let offenceAlternativePeriodLengthPage: OffenceAlternativePeriodLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    const offenceOffenceDatePage = Page.verifyOnPageTitle(
      OffenceOffenceDatePage,
      'Enter the offence dates for the first offence',
    )
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('10')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.continueButton().click()
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/alternative-period-length?periodLengthType=SENTENCE_LENGTH',
    )
    offenceAlternativePeriodLengthPage = Page.verifyOnPageTitle(OffenceAlternativePeriodLengthPage, 'sentence length')
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
