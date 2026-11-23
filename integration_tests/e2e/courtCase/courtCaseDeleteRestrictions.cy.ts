import Page from '../../pages/page'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'

context('Court case hearing delete restrictions', () => {
  const courtCaseUuid = '83517113-5c14-4628-9133-1e3cb12e31fa'
  const appearanceUuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'
  const detailsUrl = `/person/A1234AB/edit-court-case/${courtCaseUuid}/details`
  const mergedToMessage =
    'You cannot delete this hearing because this court case has been merged with another court case.'
  const mergedFromMessage =
    'You cannot delete this hearing because another court case has been merged with this court case.'
  const sentencesMessage = 'You cannot delete a hearing that includes sentences.'

  const appearance = (deleteStatus: string, chargeOverrides: object = {}) => ({
    appearanceUuid,
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
        ...chargeOverrides,
      },
    ],
    source: 'DPS',
    deleteStatus,
    documents: [],
    periodLengths: [],
  })

  const sentence = {
    sentenceUuid: '22222222-2222-4222-8222-222222222222',
    chargeNumber: '1',
    sentenceServeType: 'FORTHWITH',
    periodLengths: [],
  }

  const mergedFromCase = {
    caseReference: 'T20107142',
    courtCode: 'STHHPM',
    warrantDate: '2024-07-25',
    mergedFromDate: '2024-08-12',
  }

  const visitDetails = (status: string, hearing: object) => {
    cy.task('stubGetCourtCaseDetails', { courtCaseUuid, status, appearances: [hearing] })
    cy.signIn()
    cy.visit(detailsUrl)
    return Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
  }

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
  })

  it('should show the merged to message and no delete link for a hearing in a merged (child) case', () => {
    const page = visitDetails('MERGED', appearance('NOT_SUPPORTED'))

    page.deleteRestrictionText().should('have.length', 1).and('contain.text', mergedToMessage)
    page.hearingActionList(appearanceUuid).should('not.contain.text', 'Delete')
  })

  it('should show the merged from message and no delete link for a hearing in a case with merged cases (parent)', () => {
    const page = visitDetails('ACTIVE', appearance('NOT_SUPPORTED', { mergedFromCase }))

    page.deleteRestrictionText().should('have.length', 1).and('contain.text', mergedFromMessage)
    page.hearingActionList(appearanceUuid).should('not.contain.text', 'Delete')
  })

  it('should keep the sentences message for a hearing with sentences', () => {
    const page = visitDetails('ACTIVE', appearance('NOT_SUPPORTED', { sentence }))

    page.deleteRestrictionText().should('have.length', 1).and('contain.text', sentencesMessage)
    page.hearingActionList(appearanceUuid).should('not.contain.text', 'Delete')
  })

  it('should show both messages when the hearing is merged and has sentences', () => {
    const page = visitDetails('MERGED', appearance('NOT_SUPPORTED', { sentence }))

    page.deleteRestrictionText().should('have.length', 2)
    page.deleteRestrictionText().eq(0).should('contain.text', mergedToMessage)
    page.deleteRestrictionText().eq(1).should('contain.text', sentencesMessage)
  })

  it('should show no restriction message and a delete link when the hearing can be deleted', () => {
    const page = visitDetails('ACTIVE', appearance('SUPPORTED'))

    page.deleteRestrictionText().should('not.exist')
    page.hearingActionList(appearanceUuid).should('contain.text', 'Delete')
  })
})
