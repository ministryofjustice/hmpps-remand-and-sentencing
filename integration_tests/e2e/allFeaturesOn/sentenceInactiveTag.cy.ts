import StartPage from '../../pages/startPage'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import Page from '../../pages/page'

context('Inactive sentence tag', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
  })

  it('shows an Inactive tag on the court cases page', () => {
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetConsecutiveToDetails', {})
    cy.signIn()
    cy.visit('/person/A1234AB')
    const startPage = Page.verifyOnPage(StartPage)

    startPage
      .courtCaseDetailsComponent('261911e2-6346-42e0-b025-a806048f4d04')
      .find('.offence-card-offence-details')
      .first()
      .find('strong.govuk-tag')
      .should('contain.text', 'Inactive')
  })

  it('shows an Inactive tag on the view and edit all hearings page', () => {
    cy.task('stubGetCourtCaseSentenceLatest')
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
    const courtCaseDetailsPage = Page.verifyOnPageTitle(
      CourtCaseDetailsPage,
      'Hearings for C894623 at Accrington Youth Court',
    )

    courtCaseDetailsPage
      .hearingsSection()
      .find('[data-qa=hearing]')
      .first()
      .find('[data-qa=offences] .offence-card-offence-details')
      .first()
      .find('strong.govuk-tag')
      .should('contain.text', 'Inactive')
  })

  it('shows an Inactive tag on the edit hearing page', () => {
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes', [
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
    cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
      sentenceUuids: '([a-z0-9-]*,)*[a-z0-9-]*',
      hasSentenceAfterOnOtherCourtAppearance: false,
    })
    cy.task('stubGetSentenceAppearanceDetails')
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubOverallSentenceLengthPass')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/hearing-details',
    )
    const courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')

    courtCaseHearingDetailsPage
      .custodialOffences()
      .find('.offence-card-offence-details')
      .first()
      .find('strong.govuk-tag')
      .should('contain.text', 'Inactive')
  })
})
