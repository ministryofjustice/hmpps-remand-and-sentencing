import dayjs from 'dayjs'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'

context('Court Case Warrant Date Page', () => {
  let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
  })

  it('displays person details', () => {
    courtCaseWarrantDatePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseWarrantDatePage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseWarrantDatePage.button().click()
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Warrant date must include day Warrant date must include month Warrant date must include year',
      )
  })

  it('submitting an invalid date results in an error', () => {
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('35')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('1')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2024')
    courtCaseWarrantDatePage.button().click()
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type(futureDate.date().toString())
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type((futureDate.month() + 1).toString())
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type(futureDate.year().toString())
    courtCaseWarrantDatePage.button().click()
    courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Warrant date must be in the past')
  })
})
