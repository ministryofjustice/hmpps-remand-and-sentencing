import dayjs from 'dayjs'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import Page from '../../pages/page'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'

context('Unknown recall sentence conviction date', () => {
  let offenceConvictionDatePage: OffenceConvictionDatePage
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
    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/conviction-date',
    )
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Conviction date must include day Conviction date must include month Conviction date must include year',
      )
  })

  it('Conviction date cannot be in the future and must be within 100 years', () => {
    const futureDate = dayjs().add(7, 'day')
    offenceConvictionDatePage.dayDateInput('convictionDate').type(futureDate.date().toString())
    offenceConvictionDatePage.monthDateInput('convictionDate').type((futureDate.month() + 1).toString())
    offenceConvictionDatePage.yearDateInput('convictionDate').type(futureDate.year().toString())
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date cannot be a date in the future')

    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('01')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('01')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('1899')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')
  })

  it('submitting an invalid conviction date results in an error', () => {
    offenceConvictionDatePage.dayDateInput('convictionDate').type('35')
    offenceConvictionDatePage.monthDateInput('convictionDate').type('1')
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2024')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('Conviction date must be after the warrant date', () => {
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('09')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('07')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2025')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be on or before the warrant date')
  })

  it('Conviction date must be after offence start and end dates', () => {
    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/offence-date',
    )
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('16')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('15')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('08')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be after the offence start date')

    cy.visit(
      '/person/A1234AB/unknown-recall-sentence/court-appearance/474fd702-b329-4284-b89e-0d37fdd09eff/charge/71bb9f7e-971c-4c34-9a33-43478baee74f/offence-date',
    )
    offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('20')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('19')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('08')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The conviction date must be after the offence start date and offence end date',
      )
  })
})
