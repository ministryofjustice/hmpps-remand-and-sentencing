import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CriminalOfficeReferencePage from '../../pages/CriminalOfficeReferencePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Appeals journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetLatestCourtAppearance', {
      courtCaseUuid: '261911e2-6346-42e0-b025-a806048f4d04',
    })
    cy.signIn()
    cy.visit('/person/A1234AB')
  })
  it('fill in appeals journey', () => {
    const startPage = Page.verifyOnPage(StartPage)
    startPage.addAppealsLink('261911e2-6346-42e0-b025-a806048f4d04').click()
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add an appeal')
    courtCaseTaskListPage
      .taskList()
      .getTaskList()
      .should('deep.equal', [
        {
          name: 'Add hearing information',
          status: 'Incomplete',
        },
        {
          name: 'Record appeal',
          status: 'Cannot start yet',
        },
        {
          name: 'Upload court documents',
          status: 'Cannot start yet',
        },
      ])
    courtCaseTaskListPage.hearingInformationLink().click()
    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()
    const criminalOfficeReferencePage = Page.verifyOnPage(CriminalOfficeReferencePage)
    criminalOfficeReferencePage.input().type('A12345')
    criminalOfficeReferencePage.continueButton().click()
  })
})
