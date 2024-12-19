import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextHearingCourtNamePage from '../pages/courtCaseNextHearingCourtNamePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import Page from '../pages/page'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'

context('Check Next Hearing Answers page', () => {
  let courtCaseCheckOffenceAnswersPage: CourtCaseCheckNextHearingAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAppearanceTypeByUuid')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-next-hearing-answers')
    courtCaseCheckOffenceAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCheckOffenceAnswersPage.continueButton().should('contain.text', 'Accept and continue')
  })

  it('clicking next hearing type and submitting goes back to check answers page', () => {
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-type').click()
    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextHearingTypePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing location and submitting goes back to check answers page', () => {
    cy.task('stubGetCourtById', {})
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/court-name')
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-next-hearing-answers')
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-court-select').click()
    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('false').click()
    courtCaseNextHearingCourtSetPage.continueButton().click()
    const courtCaseNextHearingCourtNamePage = Page.verifyOnPage(CourtCaseNextHearingCourtNamePage)
    courtCaseNextHearingCourtNamePage.autoCompleteInput().type('cou')
    courtCaseNextHearingCourtNamePage.firstAutoCompleteOption().click()
    courtCaseNextHearingCourtNamePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing date and submitting goes back to check answers page', () => {
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-date').click()
    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.dayDateInput('nextHearingDate').type('15')
    courtCaseNextHearingDatePage.monthDateInput('nextHearingDate').type('12')
    courtCaseNextHearingDatePage.yearDateInput('nextHearingDate').type('2024')
    courtCaseNextHearingDatePage.continueButton().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })
})
