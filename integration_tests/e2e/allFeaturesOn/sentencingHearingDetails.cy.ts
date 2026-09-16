import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import Page from '../../pages/page'
import SelectJudicialFindingsPage from '../../pages/SelectJudicialFindingsPage'

// TODO: once judicial findings is switched on merge with sentence/sentencingHearingDetails.cy.ts
context('Sentencing appearance details Page', () => {
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
      {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
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
  })

  context('DPS sentence hearing', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceAppearanceDetails')
      cy.task('stubGetSentenceTypesByIds', [
        {
          sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
          description: 'Imprisonment in Default of Fine',
          classification: 'FINE',
        },
        {
          sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
          description: 'EDS (Extended Determinate Sentence)',
          classification: 'EXTENDED',
        },
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
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    })

    it('can add judicial findings onto sentenced offence', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
        description: 'EDS (Extended Determinate Sentence)',
        classification: 'EXTENDED',
      })
      cy.task('stubGetChargeOutcomeById', {})
      courtCaseHearingDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
        )
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 3',
        Offence: 'PS90037 An offence description',
        Outcome: 'Imprisonment',
        'Committed on': '15/12/2023',
        'Conviction date': 'Enter conviction date',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '1 years 0 months 0 weeks 0 days',
        'Licence period': '2 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Consecutive',
        'Consecutive to': 'Count 1',
        'Aggravating factors': 'Add aggravating factors',
        'Judicial findings': 'Add judicial finding of domestic abuse',
      })
      offenceEditOffencePage.addJudicialFindingsCta().click()
      const selectJudicialFindingsPage = Page.verifyOnPage(SelectJudicialFindingsPage)
      selectJudicialFindingsPage.checkboxSelector('FINDING_OF_DOMESTIC_ABUSE').should('not.be.checked').click()
      selectJudicialFindingsPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 3',
        Offence: 'PS90037 An offence description',
        Outcome: 'Imprisonment',
        'Committed on': '15/12/2023',
        'Conviction date': 'Enter conviction date',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '1 years 0 months 0 weeks 0 days',
        'Licence period': '2 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Consecutive',
        'Consecutive to': 'Count 1',
        'Aggravating factors': 'Add aggravating factors',
        'Judicial findings': 'Finding of domestic abuse',
      })
    })
  })
})
