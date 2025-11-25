import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import Page from '../../pages/page'

context('Add Offence Period Length Page', () => {
  let offencePeriodLengthPage: OffencePeriodLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('20')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-05-12',
      offenceDate: '2023-05-11',
    })
    const offenceOffenceDatePage = Page.verifyOnPageTitle(
      OffenceOffenceDatePage,
      'Enter the offence dates for the first offence',
    )
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('11')
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
  })
  context('when the sentence type is Standard Determinate Sentence', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/period-length?periodLengthType=SENTENCE_LENGTH',
      )
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
    })
    it('submitting without entering anything in the inputs results in an error', () => {
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must enter the sentence length')
    })

    it('submitting a decimal number results in an error', () => {
      offencePeriodLengthPage.yearsInput().type('1.5')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem The number must be a whole number, or 0')
    })

    it('submitting all zeros results in an error', () => {
      offencePeriodLengthPage.yearsInput().type('0')
      offencePeriodLengthPage.monthsInput().type('0')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem The sentence length cannot be 0')
    })
  })
  context('when the period length type is tariff length', () => {
    it('submitting without entering anything in the inputs results in an error', () => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/period-length?periodLengthType=TARIFF_LENGTH',
      )
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'tariff length')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must enter the tariff length')
    })
  })
})
