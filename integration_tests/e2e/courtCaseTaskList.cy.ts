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
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('Save draft button and related text should not display', () => {
    courtCaseTaskListPage.submitDraftButton().should('not.exist')
    courtCaseTaskListPage.saveDraftParagraph().should('not.exist')
  })

  it('back link does not exist', () => {
    courtCaseTaskListPage.backLink().should('not.exist')
  })
})
