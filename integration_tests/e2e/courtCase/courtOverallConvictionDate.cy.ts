import dayjs from 'dayjs'
import CourtCaseOverallConvictionDatePage from '../../pages/courtCaseOverallConvictionDatePage'
import Page from '../../pages/page'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import SentencingWarrantInformationCheckAnswersPage from '../../pages/sentencingWarrantInformationCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'

context('Court Case Overall Conviction Date Page', () => {
  let courtCaseOverallConvictionDatePage: CourtCaseOverallConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-conviction-date')
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Select yes if the conviction date is the same for all offences on the warrant',
      )
  })

  it('selecting yes and not entering anything in input results in error', () => {
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
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
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
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
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    const futureDate = dayjs().add(7, 'day')
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').type(futureDate.date().toString())
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').type((futureDate.month() + 1).toString())
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').type(futureDate.year().toString())
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date cannot be a date in the future')
  })

  it('after confirm and continue check answers this becomes uneditable', () => {
    cy.task('stubGetAllAppearanceOutcomes')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-conviction-date')
    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('12')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('5')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('2023')
    courtCaseOverallConvictionDatePage.continueButton().click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Imprisonment').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/check-overall-answers')
    const offenceCheckOverallAnswersPage = Page.verifyOnPage(SentencingWarrantInformationCheckAnswersPage)
    offenceCheckOverallAnswersPage.confirmAndContinueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-conviction-date')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You cannot submit after confirming overall warrant information')
  })

  it('Conviction date must be within the last 100 years and before warrant date', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('08')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('07')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-conviction-date')

    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('01')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('01')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('1899')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')

    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('09')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('07')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('2025')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The conviction date must be on or before the warrant date')
  })

  it('Conviction date must be after any offence date in remand-to-sentencing journey', () => {
    cy.task('stubGetLatestCourtAppearance', {})
    cy.task('stubGetLatestOffenceDate', {})
    cy.task('stubGetAllAppearanceOutcomes', {})
    cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/sentencing/overall-conviction-date',
    )

    courtCaseOverallConvictionDatePage.radioLabelSelector('true').click()
    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('31')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('12')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('1999')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The conviction date must be after any existing offence dates in the court case',
      )

    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('01')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('01')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('2000')
    courtCaseOverallConvictionDatePage.continueButton().click()
    courtCaseOverallConvictionDatePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem The conviction date must be after any existing offence dates in the court case',
      )

    courtCaseOverallConvictionDatePage.dayDateInput('overallConvictionDate').clear().type('02')
    courtCaseOverallConvictionDatePage.monthDateInput('overallConvictionDate').clear().type('01')
    courtCaseOverallConvictionDatePage.yearDateInput('overallConvictionDate').clear().type('2000')
    courtCaseOverallConvictionDatePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseOverallCaseOutcomePage, 'Select the overall case outcome')
  })
})
