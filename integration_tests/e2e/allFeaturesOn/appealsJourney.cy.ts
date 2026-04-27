import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Appeals journey', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
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
  })
})
