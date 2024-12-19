import dayjs from 'dayjs'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import Page from '../pages/page'

context('Add Offence Offence Date Page', () => {
  let offenceOffenceDatePage: OffenceOffenceDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  })

  it('displays person details', () => {
    offenceOffenceDatePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceDatePage.continueButton().should('contain.text', 'Continue')
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
      .should('equal', 'There is a problem Offence start date must use a date from the past')
  })

  it('submitting an  invalid start date results in an error', () => {
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
      .should('equal', 'There is a problem Offence end date must use a date from the past')
  })
})
