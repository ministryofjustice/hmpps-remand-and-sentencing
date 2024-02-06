import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'
import CourtCaseNextHearingCourtNamePage from '../pages/courtCaseNextHearingCourtNamePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import Page from '../pages/page'

context('Check Next Hearing Answers page', () => {
  let courtCaseCheckOffenceAnswersPage: CourtCaseCheckNextHearingAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/check-next-hearing-answers')
    courtCaseCheckOffenceAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseCheckOffenceAnswersPage.button().should('contain.text', 'Save and continue')
  })

  it('clicking next hearing type and submitting goes back to check answers page', () => {
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-type').click()
    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioLabelSelector('Court appearance').click()
    courtCaseNextHearingTypePage.button().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing location and submitting goes back to check answers page', () => {
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-court-select').click()
    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioLabelSelector('false').click()
    courtCaseNextHearingCourtSetPage.button().click()
    const courtCaseNextHearingCourtNamePage = Page.verifyOnPage(CourtCaseNextHearingCourtNamePage)
    courtCaseNextHearingCourtNamePage.autoCompleteInput().type('cou')
    courtCaseNextHearingCourtNamePage.firstAutoCompleteOption().click()
    courtCaseNextHearingCourtNamePage.button().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })

  it('clicking next hearing date and submitting goes back to check answers page', () => {
    courtCaseCheckOffenceAnswersPage.changeLink('A1234AB', '0', '0', 'next-hearing-date').click()
    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.dayDateInput('next-hearing-date').type('15')
    courtCaseNextHearingDatePage.monthDateInput('next-hearing-date').type('12')
    courtCaseNextHearingDatePage.yearDateInput('next-hearing-date').type('2024')
    courtCaseNextHearingDatePage.button().click()
    Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
  })
})
