import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import Page from '../../pages/page'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'

context('Court Case Check Answers Page', () => {
  let courtCaseCheckAnswersPage: CourtCaseCheckAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetCourtById', {})
    cy.signIn()
  })

  context('Remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()
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

      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Select the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
      courtCaseOverallCaseOutcomePage.continueButton().click()

      const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
      courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
      courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

      courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('displays court appearance details', () => {
      courtCaseCheckAnswersPage.summaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'T12345678',
        'Court name': 'Accrington Youth Court',
        'Does this outcome apply to all offences on the warrant?': 'No',
        'Overall case outcome': 'Remanded in custody',
        'Warrant date': '12/05/2023',
      })
    })

    it('clicking court case reference number change and submitting goes back to check answers page', () => {
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'reference').click()
      const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
      courtCaseReferencePage.input().type('T12345678')
      courtCaseReferencePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('clicking warrant date change and submitting goes back to check answers page', () => {
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'warrant-date').click()
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('12')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('clicking court name change and submitting goes back to check answers page', () => {
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'court-name').click()
      const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
      courtCaseCourtNamePage.autoCompleteInput().type('cou')
      courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
      courtCaseCourtNamePage.firstAutoCompleteOption().click()
      courtCaseCourtNamePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('clicking Overall case outcome and submitting goes back to check answers page', () => {
      cy.task('stubGetAllAppearanceOutcomes')
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'overall-case-outcome').click()
      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Select the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
      courtCaseOverallCaseOutcomePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('clicking outcome applies to all and submitting goes back to check answers page', () => {
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'case-outcome-applied-all').click()
      const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
      courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('true').click()
      courtCaseCaseOutcomeAppliedAllPage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('after confirm and continue overall case outcome and is the outcome the same are no longer editable', () => {
      courtCaseCheckAnswersPage.continueButton().click()
      const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
      courtCaseTaskListPage.appearanceInformationLink().click()
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'overall-case-outcome').should('not.exist')
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'case-outcome-applied-all').should('not.exist')
    })
  })

  context('Sentencing', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
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

      courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('clicking warrant date change and submitting goes back to check answers page', () => {
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'warrant-date').click()
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('12')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })

    it('after confirm and continue warrant date is no longer editable', () => {
      courtCaseCheckAnswersPage.continueButton().click()
      const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
      courtCaseTaskListPage.appearanceInformationLink().click()
      courtCaseCheckAnswersPage.changeLink('A1234AB', '0', '0', 'warrant-date').should('not.exist')
    })
  })
})
