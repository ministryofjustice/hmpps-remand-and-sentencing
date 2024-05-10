import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import Page from '../pages/page'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'

context('Court Case Check Answers Page', () => {
  let courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/check-answers')
    courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('displays person details', () => {
    courtCaseCheckAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to Save court case is displayed', () => {
    courtCaseCheckAnswersPage.button().should('contain.text', 'Accept and continue')
  })

  it('clicking court case reference number change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'reference').click()
    const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking warrant date change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'warrant-date').click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking court name change and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'court-name').click()
    const courtCaseCourtNamePage = Page.verifyOnPage(CourtCaseCourtNamePage)
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking Overall case outcome and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'overall-case-outcome').click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPage(CourtCaseOverallCaseOutcomePage)
    courtCaseOverallCaseOutcomePage.radioLabelSelector('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking outcome applies to all and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'case-outcome-applied-all').click()
    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
    courtCaseCaseOutcomeAppliedAllPage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })

  it('clicking tagged bail and submitting goes back to check answers page', () => {
    courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'tagged-bail').click()
    const courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
    courtCaseTaggedBailPage.radioLabelSelector('true').click()
    courtCaseTaggedBailPage.input().type('5')
    courtCaseTaggedBailPage.button().click()
    Page.verifyOnPage(CourtCaseCheckAnswersPage)
  })
})
