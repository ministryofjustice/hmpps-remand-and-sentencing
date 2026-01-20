import dayjs from 'dayjs'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import Page from '../../pages/page'

context('Unknown recall sentence offence date', () => {
  let offenceOffenceDatePage: OffenceOffenceDatePage
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
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  })

  it('cancel button should not be visible', () => {
    offenceOffenceDatePage.cancelButton().should('not.exist')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Offence start date must include day Offence start date must include month Offence start date must include year',
      )
  })

  it('submitting a start date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type(futureDate.date().toString())
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type((futureDate.month() + 1).toString())
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type(futureDate.year().toString())
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence start date must be a date from the past')
  })

  it('submitting an invalid start date results in an error', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('35')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting only day of end date results in an error', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').type('18')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Offence end date must include month Offence end date must include year')
  })

  it('submitting an invalid end date results in an error', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').type('35')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting an invalid end date results in an error', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    const futureDate = dayjs().add(7, 'day')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').type(futureDate.date().toString())
    offenceOffenceDatePage.monthDateInput('offenceEndDate').type((futureDate.month() + 1).toString())
    offenceOffenceDatePage.yearDateInput('offenceEndDate').type(futureDate.year().toString())
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be a date from the past')
  })

  it('submitting an end date that is before the start date results in an error', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').type('5')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').type('1')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be after the offence start date')
  })

  it('Offence dates must be before the warrant date', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('08')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence start date must be before the warrant date')

    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('07')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('09')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('07')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2025')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The offence end date must be before the warrant date')
  })

  it('Dates must be within 100 years', () => {
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('01')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('01')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('1924')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')

    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('5')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('01')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('01')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('1924')
    offenceOffenceDatePage.continueButton().click()
    offenceOffenceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })
})
