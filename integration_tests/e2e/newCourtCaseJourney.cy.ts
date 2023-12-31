import Page from '../pages/page'
import StartPage from '../pages/startPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import CourtCaseNextHearingDatePage from '../pages/courtCaseNextHearingDatePage'
import CourtCaseNextHearingSetPage from '../pages/courtCaseNextHearingSetPage'
import CourtCaseNextHearingTypePage from '../pages/courtCaseNextHearingTypePage'
import CourtCaseNextHearingCourtSetPage from '../pages/courtCaseNextHearingCourtSetPage'
import CourtCaseCheckNextHearingAnswersPage from '../pages/courtCaseCheckNextHearingAnswersPage'

context('New Court Case journey', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.task('stubGetOffenceByCode')
    cy.task('stubCreateCourtCase')
    cy.task('stubSearchCourtCases')
    cy.task('stubGetOffencesByCodes')
    cy.signIn()
    cy.visit('/person/A1234AB')
  })

  it('fill in whole journey and check answers shows inputted values', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.button().click()
    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('1234')
    courtCaseReferencePage.button().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrant-date').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrant-date').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrant-date').type('2023')
    courtCaseWarrantDatePage.button().click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    courtCaseOverallCaseOutcomePage.radioSelector('Remand in Custody (Bail Refused)').click()
    courtCaseOverallCaseOutcomePage.button().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Court case reference number': '1234',
      'Court name': 'Bradford Crown Court',
      'Warrant date': '12 05 2023',
      'Overall case outcome': 'Remand in Custody (Bail Refused)',
    })
    courtCaseCheckAnswersPage.button().click()
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.button().click()
    const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    offenceOffenceCodeConfirmPage.button().click()
    const offenceOffenceDatePage = Page.verifyOnPage(OffenceOffenceDatePage)
    offenceOffenceDatePage.dayDateInput('offence-start-date').type('12')
    offenceOffenceDatePage.monthDateInput('offence-start-date').type('5')
    offenceOffenceDatePage.yearDateInput('offence-start-date').type('2023')
    offenceOffenceDatePage.button().click()
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '1234')
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    const courtCaseNextHearingSetPage = Page.verifyOnPage(CourtCaseNextHearingSetPage)
    courtCaseNextHearingSetPage.radioSelector('true').click()
    courtCaseNextHearingSetPage.button().click()
    const courtCaseNextHearingTypePage = Page.verifyOnPage(CourtCaseNextHearingTypePage)
    courtCaseNextHearingTypePage.radioSelector('Court appearance').click()
    courtCaseNextHearingTypePage.button().click()
    const courtCaseNextHearingDatePage = Page.verifyOnPage(CourtCaseNextHearingDatePage)
    courtCaseNextHearingDatePage.dayDateInput('next-hearing-date').type('18')
    courtCaseNextHearingDatePage.monthDateInput('next-hearing-date').type('10')
    courtCaseNextHearingDatePage.yearDateInput('next-hearing-date').type('2023')
    courtCaseNextHearingDatePage.button().click()
    const courtCaseNextHearingCourtSetPage = Page.verifyOnPage(CourtCaseNextHearingCourtSetPage)
    courtCaseNextHearingCourtSetPage.radioSelector('true').click()
    courtCaseNextHearingCourtSetPage.button().click()
    const courtCaseNextHearingAnswersPage = Page.verifyOnPage(CourtCaseCheckNextHearingAnswersPage)
    courtCaseNextHearingAnswersPage.button().click()
    cy.task('verifyCreateCourtCaseRequest').should('equal', 1)
    // once confirmation page is implemented it will go to that page
  })
})
