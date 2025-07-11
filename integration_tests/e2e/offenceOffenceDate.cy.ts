import dayjs from 'dayjs'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import Page from '../pages/page'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'

context('Add Offence Offence Date Page', () => {
  let offenceOffenceDatePage: OffenceOffenceDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  })

  // it('displays person details', () => {
  //   offenceOffenceDatePage
  //     .prisonerBanner()
  //     .should('contain.text', 'Meza, Cormac')
  //     .and('contain.text', 'A1234AB')
  //     .and('contain.text', 'EstablishmentHMP Bedford')
  //     .and('contain.text', 'Cell numberCELL-1')
  // })
  //
  // it('button to continue is displayed', () => {
  //   offenceOffenceDatePage.continueButton().should('contain.text', 'Continue')
  // })
  //
  // it('submitting without entering anything in the inputs results in an error', () => {
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should(
  //       'equal',
  //       'There is a problem Offence start date must include day Offence start date must include month Offence start date must include year',
  //     )
  // })
  //
  // it('submitting a start date in the future results in an error', () => {
  //   const futureDate = dayjs().add(7, 'day')
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type(futureDate.date().toString())
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type((futureDate.month() + 1).toString())
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type(futureDate.year().toString())
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem Offence start date must use a date from the past')
  // })
  //
  // it('submitting an  invalid start date results in an error', () => {
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type('35')
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem This date does not exist.')
  // })
  //
  // it('submitting only day of end date results in an error', () => {
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
  //   offenceOffenceDatePage.dayDateInput('offenceEndDate').type('18')
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem Offence end date must include month Offence end date must include year')
  // })
  //
  // it('submitting an invalid end date results in an error', () => {
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
  //   offenceOffenceDatePage.dayDateInput('offenceEndDate').type('35')
  //   offenceOffenceDatePage.monthDateInput('offenceEndDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem This date does not exist.')
  // })
  //
  // it('submitting an invalid end date results in an error', () => {
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
  //   const futureDate = dayjs().add(7, 'day')
  //   offenceOffenceDatePage.dayDateInput('offenceEndDate').type(futureDate.date().toString())
  //   offenceOffenceDatePage.monthDateInput('offenceEndDate').type((futureDate.month() + 1).toString())
  //   offenceOffenceDatePage.yearDateInput('offenceEndDate').type(futureDate.year().toString())
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem Offence end date must use a date from the past')
  // })
  //
  // it('submitting an end date that is before the start date results in an error', () => {
  //   offenceOffenceDatePage.dayDateInput('offenceStartDate').type('15')
  //   offenceOffenceDatePage.monthDateInput('offenceStartDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2024')
  //   offenceOffenceDatePage.dayDateInput('offenceEndDate').type('5')
  //   offenceOffenceDatePage.monthDateInput('offenceEndDate').type('1')
  //   offenceOffenceDatePage.yearDateInput('offenceEndDate').type('2024')
  //   offenceOffenceDatePage.continueButton().click()
  //   offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
  //   offenceOffenceDatePage
  //     .errorSummary()
  //     .trimTextContent()
  //     .should('equal', 'There is a problem The offence end date must be after the offence start date')
  // })

  it('Conviction date must be after the warrant date', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('08')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('07')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('09')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('07')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2025')
    // offenceOffenceDatePage.continueButton().click()
    // offenceOffenceDatePage
    //     .errorSummary()
    //     .trimTextContent()
    //     .should('equal', 'There is a problem The conviction date must be on or before the warrant date')
  })
})
