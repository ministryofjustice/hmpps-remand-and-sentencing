import dayjs from 'dayjs'
import CourtCaseNextAppearanceDatePage from '../../pages/courtCaseNextAppearanceDatePage'
import Page from '../../pages/page'
import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'

context('Next appearance date page', () => {
  let courtCaseNextAppearanceDatePage: CourtCaseNextAppearanceDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-date')
    courtCaseNextAppearanceDatePage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseNextAppearanceDatePage.continueButton().click()
    courtCaseNextAppearanceDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Next court date must include day Next court date must include month Next court date must include year',
      )
  })

  it('submitting an invalid format time results in an error', () => {
    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type('15')
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type('7')
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type('2026')
    courtCaseNextAppearanceDatePage.nextAppearanceTimeInput().type('123:456')
    courtCaseNextAppearanceDatePage.continueButton().click()
    courtCaseNextAppearanceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Time must be in 1:00 or 13:00 format')
  })

  it('submitting an invalid date results in an error', () => {
    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type('35')
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type('1')
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type('2024')
    courtCaseNextAppearanceDatePage.continueButton().click()
    courtCaseNextAppearanceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem This date does not exist.')
  })

  it('submitting a date in the past results in an error', () => {
    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type('15')
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type('1')
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type('2024')
    courtCaseNextAppearanceDatePage.continueButton().click()
    courtCaseNextAppearanceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The next court date must be in the future')
  })

  it('submitting over 1 year away results in an error', () => {
    const futureDate = dayjs().add(1, 'year').add(1, 'day')
    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type(futureDate.date().toString())
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type((futureDate.month() + 1).toString())
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type(futureDate.year().toString())
    courtCaseNextAppearanceDatePage.continueButton().click()
    courtCaseNextAppearanceDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The next court appearance must be within 1 year of today’s date')
  })

  it('caption should only be shown for add next court appearance journey', () => {
    courtCaseNextAppearanceDatePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add next court appearance')
  })

  it('shows inset text for secure move', () => {
    verifyInsetTextForOption(
      '63e8fce0-033c-46ad-9edf-391b802d547a',
      'You will still need to book transport for this person, using the Book a secure move service.',
    )
  })

  it('shows inset text for video link', () => {
    verifyInsetTextForOption(
      '1da09b6e-55cb-4838-a157-ee6944f2094c',
      'You will still need to book a video link for this person, using the Book a video link service.',
    )
  })
})

function verifyInsetTextForOption(optionId, expectedText) {
  cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-type')

  const page = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
  page.radioLabelSelector(optionId).click()
  page.continueButton().click()

  const nextPage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)
  nextPage.nextAppearanceDateInset().trimTextContent().should('equal', expectedText)
}
