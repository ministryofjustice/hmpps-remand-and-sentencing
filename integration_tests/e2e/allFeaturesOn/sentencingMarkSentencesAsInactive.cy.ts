import Page from '../../pages/page'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import SelectSentencesToMarkAsInactivePage from '../../pages/selectSentencesToMarkAsInactivePage'
import CannotMarkSentencesAsInactivePage from '../../pages/cannotMarkSentencesAsInactivePage'
import ProvideReasonForMarkingSentencesAsInactivePage from '../../pages/provideReasonForMarkingSentencesAsInactivePage'

context('Mark sentences as inactive', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage

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
    cy.task('stubGetSentenceAppearanceDetailsWithActiveSentences')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/hearing-details',
    )
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })

  it('shows the mark sentences as inactive button when the hearing has active sentences', () => {
    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().should('be.visible')
  })

  it('shows the single sentence design when only one sentence is selected', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
      sentenceUuidsWithActiveSentencesAfter: [],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.hearingDetails().should('not.exist')
    selectSentencesPage.checkboxLabelSelector('10a45197-642a-4b20-b9d8-1ae89edf77cc').click()
    selectSentencesPage.continueButton().click()

    const provideReasonPage = Page.verifyOnPageTitle(
      ProvideReasonForMarkingSentencesAsInactivePage,
      'Provide a reason you want to mark this sentence as inactive',
    )
    provideReasonPage.singleSentenceOffenceSummary().should('contain.text', 'PS90037')
    provideReasonPage.singleSentenceOffenceSummary().should('contain.text', 'committed on 14/12/2023')
    provideReasonPage.hearingDetails().should('not.exist')
  })

  it('completes the whole journey: saves the reason on the sentence in session and returns to the edit hearing page', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
      sentenceUuidsWithActiveSentencesAfter: [],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('10a45197-642a-4b20-b9d8-1ae89edf77cc').click()
    selectSentencesPage.continueButton().click()

    const provideReasonPage = Page.verifyOnPageTitle(
      ProvideReasonForMarkingSentencesAsInactivePage,
      'Provide a reason you want to mark this sentence as inactive',
    )
    provideReasonPage.reasonTextarea().type('Sentence quashed on appeal')
    provideReasonPage.confirmAndSaveButton().click()

    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    cy.contains('.offence-card', 'Committed on 14/12/2023').should('contain.text', 'Inactive')
  })

  it('shows the multiple sentence design with an appearance details panel when more than one sentence is selected', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '([a-z0-9-]*,)*[a-z0-9-]*',
      sentenceUuidsWithActiveSentencesAfter: [],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('10a45197-642a-4b20-b9d8-1ae89edf77cc').click()
    selectSentencesPage.checkboxLabelSelector('3a0a10d5-1ba0-403b-86d6-8cc75ee88454').click()
    selectSentencesPage.continueButton().click()

    const provideReasonPage = Page.verifyOnPageTitle(
      ProvideReasonForMarkingSentencesAsInactivePage,
      'Provide a reason you want to mark these sentences as inactive',
    )
    provideReasonPage.hearingDetails().should('contain.text', 'C894623')
    provideReasonPage.hearingDetails().should('contain.text', 'Southampton Magistrate Court')
    provideReasonPage.hearingDetailsOffences().should('have.length', 2)
    provideReasonPage.hearingDetailsOffences().eq(0).should('contain.text', 'Count 1')
    provideReasonPage.hearingDetailsOffences().eq(0).should('contain.text', 'Forthwith')
    provideReasonPage.hearingDetailsOffences().eq(1).should('contain.text', 'Count 2')
    provideReasonPage.hearingDetailsOffences().eq(1).should('contain.text', 'Consecutive to Count 1')
  })

  it('shows the sentence details the API flagged as blocked when it has no consecutiveTo of its own', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
      sentenceUuidsWithActiveSentencesAfter: ['3a0a10d5-1ba0-403b-86d6-8cc75ee88454'],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('3a0a10d5-1ba0-403b-86d6-8cc75ee88454').click()
    selectSentencesPage.continueButton().click()

    const cannotMarkPage = Page.verifyOnPage(CannotMarkSentencesAsInactivePage)
    cannotMarkPage.activeConsecutiveOffences().should('have.length', 1)
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'PS90037')
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Count 1')
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Forthwith')

    cannotMarkPage.goBackToSelectSentencesLink().click()
    Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
  })

  it('shows the sentence\'s own "Consecutive to" detail when that is the one the API flagged', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
      sentenceUuidsWithActiveSentencesAfter: ['10a45197-642a-4b20-b9d8-1ae89edf77cc'],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('10a45197-642a-4b20-b9d8-1ae89edf77cc').click()
    selectSentencesPage.continueButton().click()

    const cannotMarkPage = Page.verifyOnPage(CannotMarkSentencesAsInactivePage)
    cannotMarkPage.activeConsecutiveOffences().should('have.length', 1)
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Count 2')
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Consecutive to Count 1')
  })

  it('cancel changes returns to the edit hearing page', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '3a0a10d5-1ba0-403b-86d6-8cc75ee88454',
      sentenceUuidsWithActiveSentencesAfter: ['3a0a10d5-1ba0-403b-86d6-8cc75ee88454'],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('3a0a10d5-1ba0-403b-86d6-8cc75ee88454').click()
    selectSentencesPage.continueButton().click()

    const cannotMarkPage = Page.verifyOnPage(CannotMarkSentencesAsInactivePage)
    cannotMarkPage.cancelButton().click()

    Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })
})
