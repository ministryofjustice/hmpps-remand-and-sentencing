import dayjs from 'dayjs'
import CourtCaseCheckNextHearingAnswersPage from '../../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextAppearanceCourtNamePage from '../../pages/courtCaseNextAppearanceCourtNamePage'
import CourtCaseNextAppearanceCourtSetPage from '../../pages/courtCaseNextAppearanceCourtSetPage'
import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'
import CourtCaseNextAppearanceDatePage from '../../pages/courtCaseNextAppearanceDatePage'
import Page from '../../pages/page'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseNextAppearanceSetPage from '../../pages/courtCaseNextAppearanceSetPage'

context('Check Next Hearing Answers page', () => {
  let courtCaseNextHearingAnswersPage: CourtCaseCheckNextHearingAnswersPage
  const futureDate = dayjs().add(10, 'day')
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAppearanceTypeByUuid')
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-select')
    const courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
    courtCaseNextAppearanceSetPage.radioLabelSelector('true').click()
    courtCaseNextAppearanceSetPage.continueButton().click()
    const courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
    courtCaseNextAppearanceTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextAppearanceTypePage.continueButton().click()

    const courtCaseNextAppearanceDatePage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)

    courtCaseNextAppearanceDatePage.dayDateInput('nextAppearanceDate').type(futureDate.date().toString())
    courtCaseNextAppearanceDatePage.monthDateInput('nextAppearanceDate').type((futureDate.month() + 1).toString())
    courtCaseNextAppearanceDatePage.yearDateInput('nextAppearanceDate').type(futureDate.year().toString())
    courtCaseNextAppearanceDatePage.nextHearingTimeInput().type('9:30')
    courtCaseNextAppearanceDatePage.continueButton().click()

    const courtCaseNextAppearanceCourtSetPage = Page.verifyOnPage(CourtCaseNextAppearanceCourtSetPage)
    courtCaseNextAppearanceCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextAppearanceCourtSetPage.continueButton().click()
    courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing type and submitting goes back to check answers page', () => {
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-appearance-type').click()
    const courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
    courtCaseNextAppearanceTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextAppearanceTypePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing location and submitting goes back to check answers page', () => {
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-appearance-court-select').click()
    const courtCaseNextAppearanceCourtSetPage = Page.verifyOnPage(CourtCaseNextAppearanceCourtSetPage)
    courtCaseNextAppearanceCourtSetPage.radioLabelSelector('false').click()
    courtCaseNextAppearanceCourtSetPage.continueButton().click()
    const courtCaseNextAppearanceCourtNamePage = Page.verifyOnPage(CourtCaseNextAppearanceCourtNamePage)
    courtCaseNextAppearanceCourtNamePage.autoCompleteInput().type('cou')
    courtCaseNextAppearanceCourtNamePage.secondAutoCompleteOption().contains('Southampton Magistrate Court').click()
    courtCaseNextAppearanceCourtNamePage.continueButton().click()
    courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage
      .summaryList()
      .getSummaryList()
      .should('deep.equal', {
        'Next hearing date': `${futureDate.format('DD/MM/YYYY')} 09:30`,
        'Next hearing location': 'Southampton Magistrate Court',
        'Next hearing type': 'Court appearance',
      })
  })

  it('clicking next hearing date and submitting goes back to check answers page', () => {
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-appearance-date').click()
    const courtCaseNextAppearanceDatePage = Page.verifyOnPage(CourtCaseNextAppearanceDatePage)
    courtCaseNextAppearanceDatePage.nextHearingTimeInput().should('have.value', '09:30')
    const differentFutureDate = futureDate.add(10, 'days')
    courtCaseNextAppearanceDatePage
      .dayDateInput('nextAppearanceDate')
      .clear()
      .type(differentFutureDate.date().toString())
    courtCaseNextAppearanceDatePage
      .monthDateInput('nextAppearanceDate')
      .clear()
      .type((differentFutureDate.month() + 1).toString())
    courtCaseNextAppearanceDatePage
      .yearDateInput('nextAppearanceDate')
      .clear()
      .type(differentFutureDate.year().toString())
    courtCaseNextAppearanceDatePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('setting next-hearing-select to No and submitting goes back to check answers page', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-select')
    const courtCaseNextAppearanceSetPage = Page.verifyOnPage(CourtCaseNextAppearanceSetPage)
    courtCaseNextAppearanceSetPage.radioLabelSelector('false').click()
    courtCaseNextAppearanceSetPage.continueButton().click()
    courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Next court date set': 'Date to be fixed',
    })
  })
})
