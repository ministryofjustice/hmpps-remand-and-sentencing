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

  it('proceeds to the provide a reason page when the selected sentence has no active consecutive sentence', () => {
    cy.task('stubGetSentenceUuidsWithActiveSentencesAfter', {
      sentenceUuids: '10a45197-642a-4b20-b9d8-1ae89edf77cc',
      sentenceUuidsWithActiveSentencesAfter: [],
    })

    courtCaseHearingDetailsPage.markSentencesAsInactiveLink().click()
    const selectSentencesPage = Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
    selectSentencesPage.checkboxLabelSelector('10a45197-642a-4b20-b9d8-1ae89edf77cc').click()
    selectSentencesPage.continueButton().click()

    Page.verifyOnPage(ProvideReasonForMarkingSentencesAsInactivePage)
  })

  it('shows the cannot mark sentences as inactive page when the selected sentence has an active consecutive sentence', () => {
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
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Count 2')
    cannotMarkPage.activeConsecutiveOffences().first().should('contain.text', 'Consecutive to Count 1')

    cannotMarkPage.goBackToSelectSentencesLink().click()
    Page.verifyOnPage(SelectSentencesToMarkAsInactivePage)
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
