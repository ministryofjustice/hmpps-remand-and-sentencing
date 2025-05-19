import dayjs from 'dayjs'
import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextHearingCourtNamePage from '../pages/courtCaseNextHearingCourtNamePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import Page from '../pages/page'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'

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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-select')
    const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    courtCaseNextHearingSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingSetPage.continueButton().click()
    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextHearingTypePage.continueButton().click()

    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)

    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type(futureDate.date().toString())
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type((futureDate.month() + 1).toString())
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type(futureDate.year().toString())
    courtCaseNextHearingDatePage.nextHearingTimeInput().type('9:30')
    courtCaseNextHearingDatePage.continueButton().click()

    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('true').click()
    courtCaseNextHearingCourtSetPage.continueButton().click()
    courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('displays person details', () => {
    courtCaseNextHearingAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseNextHearingAnswersPage.continueButton().should('contain.text', 'Confirm and continue')
  })

  it('clicking next hearing type and submitting goes back to check answers page', () => {
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-type').click()
    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextHearingTypePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing location and submitting goes back to check answers page', () => {
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-court-select').click()
    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('false').click()
    courtCaseNextHearingCourtSetPage.continueButton().click()
    const courtCaseNextHearingCourtNamePage = Page.verifyOnPage(CourtCaseNextHearingCourtNamePage)
    courtCaseNextHearingCourtNamePage.autoCompleteInput().type('cou')
    courtCaseNextHearingCourtNamePage.secondAutoCompleteOption().contains('Southampton Magistrate Court').click()
    courtCaseNextHearingCourtNamePage.continueButton().click()
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
    courtCaseNextHearingAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-date').click()
    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.nextHearingTimeInput().should('have.value', '09:30')
    const differentFutureDate = futureDate.add(10, 'days')
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').clear().type(differentFutureDate.date().toString())
    courtCaseNextHearingDatePage
      .monthDateInput('nextHearingDate')
      .clear()
      .type((differentFutureDate.month() + 1).toString())
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').clear().type(differentFutureDate.year().toString())
    courtCaseNextHearingDatePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('setting next-hearing-select to No and submitting goes back to check answers page', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-hearing-select')
    const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    courtCaseNextHearingSetPage.radioLabelSelector('false').click()
    courtCaseNextHearingSetPage.continueButton().click()
    courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Next court date set': 'Date to be fixed',
    })
  })
})
