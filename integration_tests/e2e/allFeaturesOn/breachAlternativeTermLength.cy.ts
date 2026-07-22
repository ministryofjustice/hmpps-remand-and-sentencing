import BreachAlternativeTermLengthPage from '../../pages/BreachAlternativeTermLengthPage'
import Page from '../../pages/page'

context('Add Breach Alternative term Length Page', () => {
  let offenceAlternativePeriodLengthPage: BreachAlternativeTermLengthPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/alternative-breach-term-length')
    offenceAlternativePeriodLengthPage = Page.verifyOnPage(BreachAlternativeTermLengthPage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the term length of the breach')
  })

  it('submitting a decimal number results in an error', () => {
    offenceAlternativePeriodLengthPage.sentenceLengthInput('first').type('2.5')
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The number must be a whole number, or 0')
  })

  it('submitting all zeros results in an error', () => {
    offenceAlternativePeriodLengthPage.sentenceLengthInput('first').type('0')
    offenceAlternativePeriodLengthPage.sentenceLengthInput('second').type('0')
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The term length of the breach cannot be 0')
  })

  it('submitting more than 1 of the same time unit results in an error', () => {
    offenceAlternativePeriodLengthPage.sentenceLengthInput('first').type('2')
    offenceAlternativePeriodLengthPage.sentenceLengthInput('second').type('2')
    offenceAlternativePeriodLengthPage.sentenceLengthDropDown('first').select('years')
    offenceAlternativePeriodLengthPage.sentenceLengthDropDown('second').select('years')
    offenceAlternativePeriodLengthPage.continueButton().click()
    offenceAlternativePeriodLengthPage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem More than one of the same period length unit is not allowed More than one of the same period length unit is not allowed',
      )
  })
})
