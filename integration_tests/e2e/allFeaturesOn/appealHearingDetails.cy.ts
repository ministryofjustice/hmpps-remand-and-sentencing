import HearingUpdatedConfirmationPage from '../../pages/HearingUpdatedConfirmationPage'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import Page from '../../pages/page'
import SelectOffenceAppealOutcomePage from '../../pages/SelectOffenceAppealOutcomePage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import SentencingDeleteSentenceInChainPage from '../../pages/sentencingDeleteSentenceInChainPage'

context('Appeal appearance details Page', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes', [
      {
        outcomeUuid: '42a30fcd-51c0-4c18-95f9-e3a364eb9176',
        outcomeName: 'Sentence varied',
        outcomeType: 'APPEAL',
      },
      {
        outcomeUuid: 'd50a4db1-47f8-4fbd-9f7f-be7a4f0eb267',
        outcomeName: 'Sentence quashed',
        outcomeType: 'APPEAL',
      },
    ])
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
  })

  context('DPS data', () => {
    beforeEach(() => {
      cy.task('stubGetAppealAppearanceDetails')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/94608b2e-c532-4cea-bae7-57bfff4566cb/appeals/hearing-details',
      )
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    })

    it('hearing summary shows correct data', () => {
      courtCaseHearingDetailsPage.hearingSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Criminal Appeal Office reference': 'G35461',
        'Hearing date': '15/12/2023',
        Location: 'Accrington Youth Court',
        'Overall case outcome': 'Sentence varied',
      })
    })

    it('displays offences correctly', () => {
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': 'Not entered',
            Outcome: 'Sentence quashed',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2025',
            Outcome: 'Sentence varied',
          },
        ])
      courtCaseHearingDetailsPage
        .withoutAppealRecordedInset()
        .trimTextContent()
        .should('equal', 'There are no offences without an appeal recorded.')
      courtCaseHearingDetailsPage.notificationBannerContent().should('not.exist')
    })

    it('can update an offence outcome', () => {
      courtCaseHearingDetailsPage
        .updateOffenceOutcomeLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          '9b622879-8191-4a7f-9fe8-71b680417220',
        )
        .click()
      const selectOffenceAppealOutcomePage = Page.verifyOnPage(SelectOffenceAppealOutcomePage)
      selectOffenceAppealOutcomePage.radioSelector('d50a4db1-47f8-4fbd-9f7f-be7a4f0eb267').should('be.checked') // Sentence quashed
      selectOffenceAppealOutcomePage.radioLabelContains('Sentence varied').click()
      selectOffenceAppealOutcomePage.continueButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': 'Not entered',
            Outcome: 'Sentence varied',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2025',
            Outcome: 'Sentence varied',
          },
        ])
    })

    it('can delete an offence from hearing', () => {
      cy.task('stubGetOffenceByCode', {})
      courtCaseHearingDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          'appeals',
          '9b622879-8191-4a7f-9fe8-71b680417220',
        )
        .click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2025',
            Outcome: 'Sentence varied',
          },
        ])
      courtCaseHearingDetailsPage
        .notificationBannerContent()
        .trimTextContent()
        .should('equal', 'PS90037 An offence description')
    })

    it('can submit changes to API', () => {
      cy.task('stubUpdateAppealCourtAppearance')
      cy.task('stubGetLatestCourtAppearanceWithAppeal', {})
      cy.task('stubGetCourtById', {})
      courtCaseHearingDetailsPage
        .updateOffenceOutcomeLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          '9b622879-8191-4a7f-9fe8-71b680417220',
        )
        .click()
      const selectOffenceAppealOutcomePage = Page.verifyOnPage(SelectOffenceAppealOutcomePage)
      selectOffenceAppealOutcomePage.radioLabelContains('Sentence varied').click()
      selectOffenceAppealOutcomePage.continueButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage.confirmButton().click()
      Page.verifyOnPage(HearingUpdatedConfirmationPage)
      cy.task('verifyUpdateAppealCourtAppearanceRequest').should('equal', 1)
    })
  })

  context('NOMIS data', () => {
    beforeEach(() => {
      cy.task('stubGetLegacyAppealAppearanceDetails')
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
      cy.task('stubGetCourtById', {})
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/94608b2e-c532-4cea-bae7-57bfff4566cb/appeals/hearing-details',
      )
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    })

    it('displays sentences correctly', () => {
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/06/2023',
            Outcome: 'Sentence varied',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '4 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '20/06/2023',
            Outcome: 'Sentence varied',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Consecutive to PS90037 - An offence description committed on 15/06/2023',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/06/2023',
            Outcome: 'Sentence quashed',
          },
        ])
    })

    it('edit sentence', () => {
      courtCaseHearingDetailsPage
        .editOffenceLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          '71bb9f7e-971c-4c34-9a33-43478baee74f',
        )
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('71bb9f7e-971c-4c34-9a33-43478baee74f', 'offence-outcome').click()
      const offenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOutcomePage.radioLabelContains('Sentence quashed').click()
      offenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': '15/06/2023',
        Outcome: 'Sentence quashed',
      })
      offenceEditOffencePage.continueButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '20/06/2023',
            Outcome: 'Sentence varied',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Select consecutive or concurrent',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/06/2023',
            Outcome: 'Sentence quashed',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/06/2023',
            Outcome: 'Sentence quashed',
          },
        ])
    })

    it('does not show edit appeal date link when sentence on hearing', () => {
      courtCaseHearingDetailsPage
        .editFieldLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          'appeal-date',
          '/appeals',
        )
        .should('not.exist')
    })

    it('can delete an offence sentences after on same case', () => {
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuids: '5499443b-becd-4733-bdea-f8f2f33e9b56,775cd689-565c-4540-b573-4eb555c5ec60',
      })
      courtCaseHearingDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          'appeals',
          '71bb9f7e-971c-4c34-9a33-43478baee74f',
        )
        .click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      const sentencingDeleteSentenceInChainPage = Page.verifyOnPage(SentencingDeleteSentenceInChainPage)
      sentencingDeleteSentenceInChainPage.continueButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage
        .appealedOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '20/06/2023',
            Outcome: 'Sentence varied',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Select consecutive or concurrent',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/06/2023',
            Outcome: 'Sentence quashed',
          },
        ])
    })
  })
})
