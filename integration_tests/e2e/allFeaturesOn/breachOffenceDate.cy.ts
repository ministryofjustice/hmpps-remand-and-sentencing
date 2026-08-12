import dayjs from 'dayjs'
import BreachOffenceDatePage from '../../pages/BreachOffenceDatePage'
import Page from '../../pages/page'
import BreachTypePage from '../../pages/BreachTypePage'
import BreachDatePage from '../../pages/BreachDatePage'
import BreachCheckHearingAnswersPage from '../../pages/BreachCheckHearingAnswersPage'
import BreachTermLengthPage from '../../pages/BreachTermLengthPage'
import BreachCourtNamePage from '../../pages/BreachCourtNamePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'

context('Add Breach Offence Date Page', () => {
  let breachOffenceDatePage: BreachOffenceDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {
      offenceCode: 'SE20538',
    })
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '0',
      latestSentenceAppearanceDate: '2000-01-01',
    })
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-type')
    const breachTypePage = Page.verifyOnPage(BreachTypePage)
    breachTypePage.radioLabelSelector('BREACH_OF_IMPRISONABLE_OFFENCE').click()
    breachTypePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a breach')
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/hearing-date')
    const breachDatePage = Page.verifyOnPage(BreachDatePage)
    breachDatePage.dayDateInput('breachDate').type('8')
    breachDatePage.monthDateInput('breachDate').type('7')
    breachDatePage.yearDateInput('breachDate').type('2025')
    breachDatePage.continueButton().click()
    Page.verifyOnPage(BreachCourtNamePage)
    cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/0/breach/breach-term-length')
    const breachTermLengthPage = Page.verifyOnPage(BreachTermLengthPage)
    breachTermLengthPage.daysInput().type('41')
    breachTermLengthPage.continueButton().click()
    breachOffenceDatePage = Page.verifyOnPage(BreachOffenceDatePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Offence start date must include day Offence start date must include month Offence start date must include year',
      )
  })

  it('submitting a start date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    breachOffenceDatePage.dayDateInput('offenceStartDate').type(futureDate.date().toString())
    breachOffenceDatePage.monthDateInput('offenceStartDate').type((futureDate.month() + 1).toString())
    breachOffenceDatePage.yearDateInput('offenceStartDate').type(futureDate.year().toString())
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence start date must be a date from the past')
  })

  it('submitting an invalid start date results in an error', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').type('35')
    breachOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting only day of end date results in an error', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    breachOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    breachOffenceDatePage.dayDateInput('offenceEndDate').type('18')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Offence end date must include month Offence end date must include year')
  })

  it('submitting an invalid end date results in an error', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    breachOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    breachOffenceDatePage.dayDateInput('offenceEndDate').type('35')
    breachOffenceDatePage.monthDateInput('offenceEndDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting an invalid end date results in an error', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    breachOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    const futureDate = dayjs().add(7, 'day')
    breachOffenceDatePage.dayDateInput('offenceEndDate').type(futureDate.date().toString())
    breachOffenceDatePage.monthDateInput('offenceEndDate').type((futureDate.month() + 1).toString())
    breachOffenceDatePage.yearDateInput('offenceEndDate').type(futureDate.year().toString())
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be a date from the past')
  })

  it('submitting an end date that is before the start date results in an error', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    breachOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    breachOffenceDatePage.dayDateInput('offenceEndDate').type('5')
    breachOffenceDatePage.monthDateInput('offenceEndDate').type('1')
    breachOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be after the offence start date')
  })

  it('Offence dates must be before or on the warrant date', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').clear().type('09')
    breachOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    breachOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence start date must be on or before the warrant date')

    breachOffenceDatePage.dayDateInput('offenceStartDate').clear().type('07')
    breachOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    breachOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    breachOffenceDatePage.dayDateInput('offenceEndDate').clear().type('09')
    breachOffenceDatePage.monthDateInput('offenceEndDate').clear().type('07')
    breachOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2025')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage.errorSummary().contains('offence end date')
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be on or before the warrant date')
  })

  it('Dates must be within 100 years', () => {
    breachOffenceDatePage.dayDateInput('offenceStartDate').clear().type('01')
    breachOffenceDatePage.monthDateInput('offenceStartDate').clear().type('01')
    breachOffenceDatePage.yearDateInput('offenceStartDate').clear().type('1924')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')

    breachOffenceDatePage.dayDateInput('offenceStartDate').clear().type('5')
    breachOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    breachOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    breachOffenceDatePage.dayDateInput('offenceEndDate').clear().type('01')
    breachOffenceDatePage.monthDateInput('offenceEndDate').clear().type('01')
    breachOffenceDatePage.yearDateInput('offenceEndDate').clear().type('1924')
    breachOffenceDatePage.continueButton().click()
    breachOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })
})
