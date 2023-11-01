import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import Page from '../pages/page'
import StartPage from '../pages/startPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseNextCourtDateQuestionPage from '../pages/courtCaseNextCourtDateQuestionPage'
import CourtCaseNextCourtDatePage from '../pages/courtCaseNextCourtDatePage'
import CourtCaseOverviewPage from '../pages/courtCaseOverviewPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'

context('Court Case Check Answers Page', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
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
    const courtCaseNextCourtDateQuestionPage = Page.verifyOnPage(CourtCaseNextCourtDateQuestionPage)
    courtCaseNextCourtDateQuestionPage.yesRadioButton().click()
    courtCaseNextCourtDateQuestionPage.button().click()

    const courtCaseNextCourtDatePage = Page.verifyOnPage(CourtCaseNextCourtDatePage)
    courtCaseNextCourtDatePage.dayDateInput('next-court-date').type('23')
    courtCaseNextCourtDatePage.monthDateInput('next-court-date').type('8')
    courtCaseNextCourtDatePage.yearDateInput('next-court-date').type('2023')
    courtCaseNextCourtDateQuestionPage.button().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Court case reference number': '1234',
      'Warrant date': '2023-05-12T00:00:00.000Z',
      'Court name': 'Bradford Crown Court',
      'Next court date': '2023-08-23T00:00:00.000Z',
    })
    courtCaseCheckAnswersPage.button().click()
    const courtCaseOverviewPage = new CourtCaseOverviewPage('1234')
    courtCaseOverviewPage.summaryList().getSummaryList().should('deep.equal', {
      'Court case reference number': '1234',
      'Warrant date': '2023-05-12T00:00:00.000Z',
      'Court name': 'Bradford Crown Court',
      'Next court date': '2023-08-23T00:00:00.000Z',
    })

    courtCaseOverviewPage.button().click()
    Page.verifyOnPage(OffenceOffenceDatePage)
  })
})
