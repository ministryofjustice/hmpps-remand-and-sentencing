import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import Page from '../pages/page'

context('Next hearing date page', () => {
  let courtCaseNextHearingDatePage: CourtCaseNextHearingDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-date')
    courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
  })

  it('displays person details', () => {
    courtCaseNextHearingDatePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to save draft is not displayed', () => {
    courtCaseNextHearingDatePage.saveDraftButton().should('not.exist')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingDatePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseNextHearingDatePage.continueButton().click()
    courtCaseNextHearingDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Next court date must include day Next court date must include month Next court date must include year',
      )
  })

  it('submitting an invalid format time results in an error', () => {
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type('15')
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type('7')
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type('2026')
    courtCaseNextHearingDatePage.nextHearingTimeInput().type('123:456')
    courtCaseNextHearingDatePage.continueButton().click()
    courtCaseNextHearingDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Time must be in 1:00 or 13:00 format')
  })

  it('submitting an invalid date results in an error', () => {
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type('35')
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type('1')
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type('2024')
    courtCaseNextHearingDatePage.continueButton().click()
    courtCaseNextHearingDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the past results in an error', () => {
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type('15')
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type('1')
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type('2024')
    courtCaseNextHearingDatePage.continueButton().click()
    courtCaseNextHearingDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The next court date must be in the future')
  })
})
