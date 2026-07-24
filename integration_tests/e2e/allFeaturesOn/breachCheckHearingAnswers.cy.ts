import BreachCheckHearingAnswersPage from '../../pages/BreachCheckHearingAnswersPage'
import BreachCourtNamePage from '../../pages/BreachCourtNamePage'
import BreachDatePage from '../../pages/BreachDatePage'
import BreachTermLengthPage from '../../pages/BreachTermLengthPage'
import BreachTypePage from '../../pages/BreachTypePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Breach check hearing answers page', () => {
  let breachCheckHearingAnswersPage: BreachCheckHearingAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', {})
    cy.task('stubGetCourtCaseValidationDates', {
      courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
      latestSentenceAppearanceDate: '2000-01-01',
    })
    cy.task('stubGetDtoSentencedCharges', {})
    cy.signIn()
    cy.visit('/person/A1234AB')
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addBreachLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    const breachTypePage = Page.verifyOnPage(BreachTypePage)
    breachTypePage.continueButton().click()
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a breach')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Incomplete',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()
    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('C894623')
    courtCaseReferencePage.continueButton().click()
    const breachDatePage = Page.verifyOnPage(BreachDatePage)
    breachDatePage.dayDateInput('breachDate').type('13')
    breachDatePage.monthDateInput('breachDate').type('5')
    breachDatePage.yearDateInput('breachDate').type('2023')
    breachDatePage.continueButton().click()
    const breachCourtNamePage = Page.verifyOnPage(BreachCourtNamePage)
    breachCourtNamePage.autoCompleteInput().type('cou')
    breachCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    breachCourtNamePage.firstAutoCompleteOption().click()
    breachCourtNamePage.continueButton().click()
    const breachTermLengthPage = Page.verifyOnPage(BreachTermLengthPage)
    breachTermLengthPage.daysInput().type('41')
    breachCourtNamePage.continueButton().click()
    breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Breach hearing date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Term length of the breach': '0 years 0 months 0 weeks 41 days',
    })
  })

  it('can edit case reference number and return back', () => {
    breachCheckHearingAnswersPage.editCaseReferenceNumberLink().click()
    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().should('have.value', 'C894623').clear().type('G35266')
    courtCaseReferencePage.continueButton().click()
    breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'G35266',
      'Breach hearing date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Term length of the breach': '0 years 0 months 0 weeks 41 days',
    })
  })

  it('can edit date of breach and return back', () => {
    breachCheckHearingAnswersPage.editBreachDateLink().click()
    const breachDatePage = Page.verifyOnPage(BreachDatePage)
    breachDatePage.dayDateInput('breachDate').should('have.value', '13').clear().type('15')
    breachDatePage.monthDateInput('breachDate').should('have.value', '5').clear().type('6')
    breachDatePage.yearDateInput('breachDate').should('have.value', '2023').clear().type('2024')
    breachDatePage.continueButton().click()
    breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Breach hearing date': '15/06/2024',
      'Court name': 'Accrington Youth Court',
      'Term length of the breach': '0 years 0 months 0 weeks 41 days',
    })
  })

  it('can edit court name and return back', () => {
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
    breachCheckHearingAnswersPage.editCourtNameLink().click()
    const breachCourtNamePage = Page.verifyOnPage(BreachCourtNamePage)
    breachCourtNamePage.autoCompleteInput().type('cou')
    breachCourtNamePage.secondAutoCompleteOption().contains('Southampton Magistrate Court').click()
    breachCourtNamePage.continueButton().click()
    breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Breach hearing date': '13/05/2023',
      'Court name': 'Southampton Magistrate Court',
      'Term length of the breach': '0 years 0 months 0 weeks 41 days',
    })
  })

  it('can edit term length of the breach and return back', () => {
    breachCheckHearingAnswersPage.editBreachTermLink().click()
    const breachTermLengthPage = Page.verifyOnPage(BreachTermLengthPage)
    breachTermLengthPage.daysInput().should('have.value', '41').clear()
    breachTermLengthPage.monthsInput().type('1')
    breachTermLengthPage.continueButton().click()
    breachCheckHearingAnswersPage = Page.verifyOnPage(BreachCheckHearingAnswersPage)
    breachCheckHearingAnswersPage.summaryList().getSummaryList().should('deep.equal', {
      'Case reference number': 'C894623',
      'Breach hearing date': '13/05/2023',
      'Court name': 'Accrington Youth Court',
      'Term length of the breach': '0 years 1 months 0 weeks 0 days',
    })
  })
})
