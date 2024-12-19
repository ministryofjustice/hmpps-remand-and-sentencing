import dayjs from 'dayjs'
import CourtCaseOverallConvictionDatePage from '../pages/courtCaseOverallConvictionDatePage'
import Page from '../pages/page'

context('Court Case Overall Conviction Date Page', () => {
  let courtCaseOverallConvictionDatePage: CourtCaseOverallConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-conviction-date')
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
  })

  it('displays person details', () => {
    courtCaseOverallConvictionDatePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseOverallConvictionDatePage.continueButton().should('contain.text', 'Save and continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Conviction date must include day Conviction date must include month Conviction date must include year',
      )
  })

  it('submitting an invalid date results in an error', () => {
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').type('35')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').type('1')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').type('2024')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the future results in an error', () => {
    const futureDate = dayjs().add(7, 'day')
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').type(futureDate.date().toString())
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').type((futureDate.month() + 1).toString())
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').type(futureDate.year().toString())
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Conviction date must be in the past')
  })
})
