import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'
import CourtCaseCancelCourtCasePage from '../../pages/courtCaseCancelCourtCase'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'

context('Court Case Cancel Court Case Page', () => {
  let receivedCustodialSentencePage: ReceivedCustodialSentencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
  })

  it('should not show court name and hearing date until it is provided', () => {
    receivedCustodialSentencePage.cancelButton().click()
    const courtCaseCancelCourtCasePage = Page.verifyOnPage(CourtCaseCancelCourtCasePage)
    courtCaseCancelCourtCasePage
      .description()
      .should('contain', 'You have not finished adding the information. Any information you have entered will be lost.')
  })

  it('should show court name and hearing date once it is provided', () => {
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.cancelButton().click()
    const courtCaseCancelCourtCasePage = Page.verifyOnPage(CourtCaseCancelCourtCasePage)
    courtCaseCancelCourtCasePage
      .description()
      .should(
        'contain',
        'You have not finished adding the information for the court case at Accrington Youth Court on 12/05/2023. Any information you have entered will be lost.',
      )
  })
})
