import Page from '../../pages/page'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'

context('Add missed hearing', () => {
  const courtCaseUuid = '83517113-5c14-4628-9133-1e3cb12e31fa'
  const appearance = {
    appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    appearanceDate: '2025-07-21',
    courtCode: 'STHHPM',
    warrantType: 'NON_SENTENCING',
    courtCaseReference: '1234567',
    outcome: { outcomeUuid: '1', outcomeName: 'Remanded in custody' },
    charges: [
      {
        chargeUuid: '11111111-1111-4111-8111-111111111111',
        offenceCode: 'PS90037',
        offenceStartDate: '2025-07-21',
        outcome: { outcomeUuid: '1', outcomeName: 'Remanded in custody' },
      },
    ],
    source: 'DPS',
    deleteStatus: 'SUPPORTED',
    documents: [],
    periodLengths: [],
  }

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
    cy.task('stubGetCourtCaseDetails', { courtCaseUuid, appearances: [appearance] })
    cy.task('stubGetLatestCourtAppearance', { courtCaseUuid })
    cy.signIn()
    cy.visit(`/person/A1234AB/edit-court-case/${courtCaseUuid}/details`)
  })

  it('should start a new hearing on the task list without reusing an existing appearance', () => {
    const detailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    detailsPage
      .addMissedHearingButton()
      .should('contain.text', 'Add missed hearing')
      .and('have.attr', 'href')
      .and('match', /\/add-court-appearance\/[0-9a-f-]{36}\/missed-hearing\/new-journey$/)
      .and('not.contain', appearance.appearanceUuid)

    detailsPage.addMissedHearingButton().click()

    const taskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a hearing to a court case')
    taskListPage.hearingInformationLink().should('exist')
    taskListPage.reviewOffencesLink().should('not.exist')
    taskListPage.uploadCourtDocumentsLink().should('not.exist')
    taskListPage.nextCourtAppearanceLink().should('not.exist')
    cy.get('[data-qa=continue-button]').should('be.disabled')
  })
})
