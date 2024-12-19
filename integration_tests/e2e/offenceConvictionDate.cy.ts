import dayjs from 'dayjs'
import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import Page from '../pages/page'

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
      .should('contain.text', 'Haggler, Marvin')
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

  it('submitting a start date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    offenceConvictionDatePage.dayDateInput('convictionDate').type(futureDate.date().toString())
    offenceConvictionDatePage.monthDateInput('convictionDate').type((futureDate.month() + 1).toString())
    offenceConvictionDatePage.yearDateInput('convictionDate').type(futureDate.year().toString())
    offenceConvictionDatePage.continueButton().click()
    offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Conviction date must be in the past')
  })

  it('submitting an  invalid start date results in an error', () => {
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
})
