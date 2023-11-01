import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseNextCourtDateQuestionPage from '../pages/courtCaseNextCourtDateQuestionPage'
import CourtCaseNextCourtDatePage from '../pages/courtCaseNextCourtDatePage'

context('Court Case Check Answers Page', () => {
  let courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/check-answers')
    courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to Save court case is displayed', () => {
    courtCaseCheckAnswersPage.button().should('contain.text', 'Save court case')
  })

  it('clicking court case reference number change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', 'reference').click()
    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('1234')
    courtCaseReferencePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking warrant date change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', 'warrant-date').click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrant-date').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrant-date').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrant-date').type('2023')
    courtCaseWarrantDatePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking court name change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', 'court-name').click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking next court date change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', 'next-court-date-question').click()
    const courtCaseNextCourtDateQuestionPage = Page.verifyOnPage(CourtCaseNextCourtDateQuestionPage)
    courtCaseNextCourtDateQuestionPage.yesRadioButton().click()
    courtCaseNextCourtDateQuestionPage.button().click()

    const courtCaseNextCourtDatePage = Page.verifyOnPage(CourtCaseNextCourtDatePage)
    courtCaseNextCourtDatePage.dayDateInput('next-court-date').type('23')
    courtCaseNextCourtDatePage.monthDateInput('next-court-date').type('8')
    courtCaseNextCourtDatePage.yearDateInput('next-court-date').type('2023')
    courtCaseNextCourtDateQuestionPage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })
})
