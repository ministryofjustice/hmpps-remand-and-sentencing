import Page from '../../pages/page'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'

context('Duplicate offence with multiple offence instances enabled', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.signIn()
  })

  it('displays Duplicate this offence on each custodial offence card when the feature flag is on', () => {
    cy.createSentencedOffence('A1234AB', '0', '0', '0', '1')
    Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')

    cy.createSentencedOffence('A1234AB', '0', '0', '1', '2')
    const checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 2 offences')

    checkOffenceAnswersPage
      .custodialOffences()
      .find('.offence-card')
      .should('have.length', 2)
      .each(offenceCard => {
        const editHref = offenceCard.find('[data-qa^="edit-offence-link-"]').attr('href')

        cy.wrap(offenceCard)
          .find('[data-qa^="duplicate-offence-link-"]')
          .should('have.length', 1)
          .and('be.visible')
          .and('have.text', 'Duplicate this offence')
          .and('have.attr', 'href', editHref.replace('/load-edit-offence', '/duplicate-offence'))
      })
  })
})
