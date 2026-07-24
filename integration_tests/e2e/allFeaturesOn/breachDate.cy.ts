import dayjs from 'dayjs'
import BreachDatePage from '../../pages/BreachDatePage'
import Page from '../../pages/page'

context('Breach date page', () => {
  let breachDatePage: BreachDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/hearing-date')
    breachDatePage = Page.verifyOnPage(BreachDatePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    breachDatePage.continueButton().click()
    breachDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The breach hearing date must include day The breach hearing date must include month The breach hearing date must include year',
      )
  })

  it('submitting an invalid date results in an error', () => {
    breachDatePage.dayDateInput('breachDate').type('35')
    breachDatePage.monthDateInput('breachDate').type('1')
    breachDatePage.yearDateInput('breachDate').type('2024')
    breachDatePage.continueButton().click()
    breachDatePage.errorSummary().trimTextContent().should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    breachDatePage.dayDateInput('breachDate').type(futureDate.date().toString())
    breachDatePage.monthDateInput('breachDate').type((futureDate.month() + 1).toString())
    breachDatePage.yearDateInput('breachDate').type(futureDate.year().toString())
    breachDatePage.continueButton().click()
    breachDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The breach hearing date cannot be a date in the future')
  })

  it('date must be within the last 100 years', () => {
    breachDatePage.dayDateInput('breachDate').clear().type('01')
    breachDatePage.monthDateInput('breachDate').clear().type('01')
    breachDatePage.yearDateInput('breachDate').clear().type('1899')
    breachDatePage.continueButton().click()
    breachDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })

  it('date must be after sentencing date', () => {
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '0',
      latestSentenceAppearanceDate: '2025-01-01',
    })
    breachDatePage.dayDateInput('breachDate').clear().type('29')
    breachDatePage.monthDateInput('breachDate').clear().type('12')
    breachDatePage.yearDateInput('breachDate').clear().type('2024')
    breachDatePage.continueButton().click()
    breachDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The breach hearing date must be after the sentencing warrant date in the court case',
      )
  })
})
