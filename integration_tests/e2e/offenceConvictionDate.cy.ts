import dayjs from 'dayjs'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import Page from '../pages/page'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'

context('Add Offence Conviction Date Page', () => {
  let offenceConvictionDatePage: OffenceConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
  })

  it('displays person details', () => {
    offenceConvictionDatePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceConvictionDatePage.continueButton().should('contain.text', 'Save and continue')
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

  it('submitting an  invalid conviction date results in an error', () => {
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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('08')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('07')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('16')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('15')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('08')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be after the offence start date')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('20')
    offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('8')
    offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2023')
    offenceOffenceDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
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
