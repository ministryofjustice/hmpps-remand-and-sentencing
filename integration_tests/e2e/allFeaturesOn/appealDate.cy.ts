import dayjs from 'dayjs'
import AppealDatePage from '../../pages/AppealDatePage'
import Page from '../../pages/page'

context('Appeal date page', () => {
  let appealDatePage: AppealDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/appeals/appeal-date')
    appealDatePage = Page.verifyOnPage(AppealDatePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    appealDatePage.continueButton().click()
    appealDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Appeal hearing date must include day Appeal hearing date must include month Appeal hearing date must include year',
      )
  })

  it('submitting an invalid date results in an error', () => {
    appealDatePage.dayDateInput('appealDate').type('35')
    appealDatePage.monthDateInput('appealDate').type('1')
    appealDatePage.yearDateInput('appealDate').type('2024')
    appealDatePage.continueButton().click()
    appealDatePage.errorSummary().trimTextContent().should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    appealDatePage.dayDateInput('appealDate').type(futureDate.date().toString())
    appealDatePage.monthDateInput('appealDate').type((futureDate.month() + 1).toString())
    appealDatePage.yearDateInput('appealDate').type(futureDate.year().toString())
    appealDatePage.continueButton().click()
    appealDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The appeal hearing date cannot be a date in the future')
  })

  it('date must be within the last 100 years', () => {
    appealDatePage.dayDateInput('appealDate').clear().type('01')
    appealDatePage.monthDateInput('appealDate').clear().type('01')
    appealDatePage.yearDateInput('appealDate').clear().type('1899')
    appealDatePage.continueButton().click()
    appealDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })

  it('date must be after sentencing date', () => {
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '0',
      latestSentenceAppearanceDate: '2025-01-01',
    })
    appealDatePage.dayDateInput('appealDate').clear().type('29')
    appealDatePage.monthDateInput('appealDate').clear().type('12')
    appealDatePage.yearDateInput('appealDate').clear().type('2024')
    appealDatePage.continueButton().click()
    appealDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The appeal hearing date must be after the sentencing warrant date in the court case',
      )
  })
})
