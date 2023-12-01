import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'

context('Court Case Check Answers Page', () => {
  let courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/court-cases/0/check-answers')
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
    courtCaseCheckAnswersPage.button().should('contain.text', 'Confirm and continue')
  })

  it('clicking court case reference number change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', 'reference').click()
    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('1234')
    courtCaseReferencePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking warrant date change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', 'warrant-date').click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrant-date').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrant-date').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrant-date').type('2023')
    courtCaseWarrantDatePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking court name change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', 'court-name').click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })
})
