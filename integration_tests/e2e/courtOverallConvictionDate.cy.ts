import dayjs from 'dayjs'
import CourtCaseOverallConvictionDatePage from '../pages/courtCaseOverallConvictionDatePage'
import Page from '../pages/page'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import SentencingWarrantInformationCheckAnswersPage from '../pages/sentencingWarrantInformationCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'

context('Court Case Overall Conviction Date Page', () => {
  let courtCaseOverallConvictionDatePage: CourtCaseOverallConvictionDatePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-conviction-date')
    courtCaseOverallConvictionDatePage = Page.verifyOnPage(CourtCaseOverallConvictionDatePage)
  })

  it('displays person details', () => {
    courtCaseOverallConvictionDatePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseOverallConvictionDatePage.continueButton().should('contain.text', 'Continue')
  })

  it('inset hint text is displayed', () => {
    courtCaseOverallConvictionDatePage
      .hintInset()
      .should(
        'contain.text',
        'This is not always the same as the sentencing date. You can find the conviction date on the Prison court register.',
      )
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
      .should('equal', 'There is a problem Conviction date must be in the past')
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
})
