import Page from '../../pages/page'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import ConfirmMarkSentenceAsActivePage from '../../pages/confirmMarkSentenceAsActivePage'
import CannotMarkSentenceAsActiveInactiveCasePage from '../../pages/cannotMarkSentenceAsActiveInactiveCasePage'
import CannotMarkSentenceAsActiveConsecutiveChainPage from '../../pages/cannotMarkSentenceAsActiveConsecutiveChainPage'

context('Mark sentence as active', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage

  // From stubGetSentenceAppearanceDetailsWithInactiveSentences:
  //  - charge 1 (11111111...): INACTIVE, FORTHWITH, no consecutiveTo -> happy path, and also reused for the
  //    inactive-court-case unhappy path (that block comes from stubGetCourtCaseDetails, not from this charge)
  //  - charge 2 (22222222...): INACTIVE, CONSECUTIVE to charge 3's sentence (INACTIVE) -> blocked by consecutive chain
  //  - charge 3 (33333333...): INACTIVE, FORTHWITH -> the blocking target for charge 2
  const happyPathChargeUuid = '11111111-1111-4111-8111-111111111111'
  const blockedByConsecutiveChainChargeUuid = '22222222-2222-4222-8222-222222222222'

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetAppearanceOutcomeById', {
      outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
      sentenceUuids: '([a-z0-9-]*,)*[a-z0-9-]*',
      hasSentenceAfterOnOtherCourtAppearance: false,
    })
    cy.task('stubOverallSentenceLengthPass')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetSentenceAppearanceDetailsWithInactiveSentences')
    cy.task('stubGetCourtCaseDetails', { status: 'ACTIVE' })
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/hearing-details',
    )
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })

  it('shows the Mark as active link for inactive sentences', () => {
    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).should('be.visible')
  })

  it('happy path: confirming "Yes" navigates back to the Edit hearing page and marks the sentence as active', () => {
    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).click()

    const confirmPage = Page.verifyOnPage(ConfirmMarkSentenceAsActivePage)
    confirmPage.offenceSummary().should('contain.text', 'PS90037')
    confirmPage.offenceSummary().should('contain.text', 'committed on 15/12/2023')
    confirmPage.radioLabelSelector('true').click()
    confirmPage.confirmButton().click()

    // AC3: "Then navigate to the Edit page And mark the sentence as active (The inactive label should be removed)"
    // Persistence to the API is deferred to the main "Confirm changes" journey, same as marking a sentence
    // inactive does - so the change is only staged in session here, and the removed label comes from that
    // mutated session data being rendered immediately, not from a fresh API fetch.
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).should('not.exist')
  })

  it('choosing "No, cancel changes" on the confirm page returns to edit hearing without activating', () => {
    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).click()

    const confirmPage = Page.verifyOnPage(ConfirmMarkSentenceAsActivePage)
    confirmPage.radioLabelSelector('false').click()
    confirmPage.confirmButton().click()

    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).should('be.visible')
  })

  it('routes to the "cannot mark this sentence as active" page when the sentence is consecutive to an inactive sentence', () => {
    courtCaseHearingDetailsPage.markAsActiveLink(blockedByConsecutiveChainChargeUuid).click()

    const cannotMarkPage = Page.verifyOnPage(CannotMarkSentenceAsActiveConsecutiveChainPage)
    cy.contains('This sentence cannot be marked as active as it is consecutive to an inactive sentence.').should(
      'exist',
    )
    cannotMarkPage.cancelAndGoBackButton().click()

    Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })

  it('routes to the "cannot mark a sentence as active from an inactive court case" page when the court case is inactive', () => {
    cy.task('stubGetCourtCaseDetails', { status: 'INACTIVE' })

    courtCaseHearingDetailsPage.markAsActiveLink(happyPathChargeUuid).click()

    const cannotMarkPage = Page.verifyOnPage(CannotMarkSentenceAsActiveInactiveCasePage)
    cannotMarkPage.cancelAndGoBackButton().click()

    Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })
})
