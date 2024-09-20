import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import Page from '../pages/page'

context('Add Offence Period Length Page', () => {
  let offencePeriodLengthPage: OffencePeriodLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
    const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
    offenceSentenceTypePage.button().click()
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/period-length?periodLengthType=SENTENCE_LENGTH',
    )
    offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
  })

  it('displays person details', () => {
    offencePeriodLengthPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offencePeriodLengthPage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offencePeriodLengthPage.button().click()
    offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
    offencePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the sentence length')
  })

  it('submitting a decimal number results in an error', () => {
    offencePeriodLengthPage.yearsInput().type('1.5')
    offencePeriodLengthPage.button().click()
    offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
    offencePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    offencePeriodLengthPage.yearsInput().type('0')
    offencePeriodLengthPage.monthsInput().type('0')
    offencePeriodLengthPage.button().click()
    offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
    offencePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The sentence length cannot be 0')
  })
})
