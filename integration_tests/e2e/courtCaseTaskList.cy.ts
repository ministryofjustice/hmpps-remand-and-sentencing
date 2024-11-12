import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import Page from '../pages/page'

context('Task List Page', () => {
  let courtCaseTaskListPage: CourtCaseTaskListPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/task-list')
    courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
  })

  it('displays person details', () => {
    courtCaseTaskListPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })
})
