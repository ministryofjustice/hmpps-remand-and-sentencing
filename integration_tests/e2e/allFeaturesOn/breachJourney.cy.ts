import BreachTypePage from '../../pages/BreachTypePage'
import CourtCaseSelectReferencePage from '../../pages/courtCaseSelectReferencePage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Breach journey', () => {
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
  it('fill in breach of supervision requirements journey', () => {
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
    const courtCaseSelectReferencePage = Page.verifyOnPageTitle(CourtCaseSelectReferencePage, 'C894623')
    courtCaseSelectReferencePage.radioLabelSelector('true').click()
    courtCaseSelectReferencePage.continueButton().click()
  })
})
