import CourtCaseAppearanceDetailsPage from '../../pages/courtCaseAppearanceDetailsPage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import Page from '../../pages/page'
import AppearanceUpdatedConfirmationPage from '../../pages/appearanceUpdatedConfirmationPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseAlternativeSentenceLengthPage from '../../pages/courtCaseAlternativeSentenceLengthPage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import CannotDeleteSentencePage from '../../pages/cannotDeleteSentencePage'
import SentencingDeleteSentenceInChainPage from '../../pages/sentencingDeleteSentenceInChainPage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import OffenceEditSentenceTypePage from '../../pages/offenceEditSentenceTypePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import CannotChangeSentenceOutcomePage from '../../pages/cannotChangeSentenceOutcomePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'

context('Sentencing appearance details Page', () => {
  let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage
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

  context('DPS sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceAppearanceDetails')
      cy.task('stubGetSentenceTypesByIds', [
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
        {
          sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
          description: 'Imprisonment in Default of Fine',
          classification: 'FINE',
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
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/appearance-details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
        'Overall case outcome': 'Imprisonment',
      })
    })

    it('overall displays correctly', () => {
      courtCaseAppearanceDetailsPage.overallSummaryList().getSummaryList().should('deep.equal', {
        'Overall sentence length': '4 years 0 months 0 weeks 0 days',
      })
    })

    it('displays offences correctly', () => {
      courtCaseAppearanceDetailsPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Sentence length': '4 years 0 months 0 weeks 0 days',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Consecutive or concurrent': 'Forthwith',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '14/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'A Nomis sentence type',
            'Sentence length': '1 years 2 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Consecutive to count 3',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Custodial term': '1 years 0 months 0 weeks 0 days',
            'Licence period': '2 years 0 months 0 weeks 0 days',
            'Sentence type': 'EDS (Extended Determinate Sentence)',
            'Consecutive or concurrent': 'Consecutive to count 1',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '10/12/2023',
            'Conviction date': '12/09/2024',
            Outcome: 'Imprisonment',
            'Sentence type': 'Imprisonment in Default of Fine',
            'Fine amount': '£50',
            'Term length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
        ])
      courtCaseAppearanceDetailsPage
        .noNonCustodialOutcomeInset()
        .trimTextContent()
        .should('equal', 'There are no offences with non-custodial outcomes.')
    })

    it('can edit sentence information', () => {
      cy.task('stubUpdateSentenceCourtAppearance')
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
        description: 'EDS (Extended Determinate Sentence)',
        classification: 'EXTENDED',
      })
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetLatestCourtAppearanceWithSentencing', { courtCaseUuid: '83517113-5c14-4628-9133-1e3cb12e31fa' })
      cy.task('stubGetCourtById', {})
      cy.task('stubGetAllChargeOutcomes', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
        )
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editPeriodLengthLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
          'CUSTODIAL_TERM',
        )
        .click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().should('have.value', '1')
      offencePeriodLengthPage.yearsInput().clear()
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 3',
        Offence: 'PS90037 An offence description',
        Outcome: 'Remanded in custody',
        'Committed on': '15/12/2023',
        'Conviction date': 'Enter conviction date',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '2 years 0 months 0 weeks 0 days',
        'Licence period': '2 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Consecutive',
        'Consecutive to': 'Count 1',
      })
      offenceEditOffencePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.confirmButton().click()
      Page.verifyOnPage(AppearanceUpdatedConfirmationPage)
      cy.task('verifyUpdateSentenceCourtAppearanceRequest').should('equal', 1)
    })

    it('can edit alternative overall sentence length', () => {
      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'sentencing/overall-sentence-length',
        )
        .click()
      const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
      courtCaseOverallSentenceLengthPage
        .editAlternativeLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6')
        .click()
      const courtCaseAlternativeSentenceLengthPage = Page.verifyOnPage(CourtCaseAlternativeSentenceLengthPage)
      courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('first').clear().type('2')
      courtCaseAlternativeSentenceLengthPage.sentenceLengthDropDown('first').select('months')
      courtCaseAlternativeSentenceLengthPage.sentenceLengthInput('second').clear().type('2')
      courtCaseAlternativeSentenceLengthPage.sentenceLengthDropDown('second').select('years')
      courtCaseAlternativeSentenceLengthPage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('can delete an offence sentences after on same case', () => {
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuids: 'b0f83d31-efbe-462c-970d-5293975acb17,10a45197-642a-4b20-b9d8-1ae89edf77cc',
      })
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
        description: 'EDS (Extended Determinate Sentence)',
        classification: 'EXTENDED',
      })
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      cy.task('stubGetSentenceTypesByIds', [
        {
          sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
          description: 'SDS (Standard Determinate Sentence)',
          classification: 'STANDARD',
        },
        {
          sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
          description: 'Imprisonment in Default of Fine',
          classification: 'FINE',
        },
      ])
      courtCaseAppearanceDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'sentencing',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
        )
        .click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      const sentencingDeleteSentenceInChainPage = Page.verifyOnPage(SentencingDeleteSentenceInChainPage)
      sentencingDeleteSentenceInChainPage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Sentence length': '4 years 0 months 0 weeks 0 days',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Consecutive or concurrent': 'Forthwith',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '14/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'A Nomis sentence type',
            'Sentence length': '1 years 2 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Select consecutive or current',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '10/12/2023',
            'Conviction date': '12/09/2024',
            Outcome: 'Imprisonment',
            'Sentence type': 'Imprisonment in Default of Fine',
            'Fine amount': '£50',
            'Term length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
        ])
      courtCaseAppearanceDetailsPage.confirmButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Select consecutive or concurrent')
      courtCaseAppearanceDetailsPage
        .selectConsecutiveConcurrentLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'a94b4ba8-d6b4-443e-bf69-7f1dab98a6bf',
        )
        .click()
      const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
      offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
      offenceSentenceServeTypePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Sentence length': '4 years 0 months 0 weeks 0 days',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Consecutive or concurrent': 'Forthwith',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '14/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'A Nomis sentence type',
            'Sentence length': '1 years 2 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '10/12/2023',
            'Conviction date': '12/09/2024',
            Outcome: 'Imprisonment',
            'Sentence type': 'Imprisonment in Default of Fine',
            'Fine amount': '£50',
            'Term length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
        ])
    })

    it('cannot delete an offence when there are sentences after', () => {
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuids: 'b0f83d31-efbe-462c-970d-5293975acb17,10a45197-642a-4b20-b9d8-1ae89edf77cc',
        hasSentenceAfterOnOtherCourtAppearance: true,
      })
      cy.task('stubSentencesAfterOnOtherCourtAppearanceDetails', {
        sentenceUuids: 'b0f83d31-efbe-462c-970d-5293975acb17,10a45197-642a-4b20-b9d8-1ae89edf77cc',
      })

      courtCaseAppearanceDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'sentencing',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
        )
        .click()
      const cannotDeleteSentencePage = Page.verifyOnPage(CannotDeleteSentencePage)
      cannotDeleteSentencePage
        .appearanceDetails()
        .getListItems()
        .should('deep.equal', [
          'Case  CASE123 at Accrington Youth Court on 17/05/2002',
          'Case  at Southampton Magistrate Court on 28/01/2010',
        ])
    })

    it('cannot amend outcome to non custodial when there are sentences after', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
        description: 'EDS (Extended Determinate Sentence)',
        classification: 'EXTENDED',
      })
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
      })
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuids: 'b0f83d31-efbe-462c-970d-5293975acb17,10a45197-642a-4b20-b9d8-1ae89edf77cc',
        hasSentenceAfterOnOtherCourtAppearance: true,
      })
      cy.task('stubSentencesAfterOnOtherCourtAppearanceDetails', {
        sentenceUuids: 'b0f83d31-efbe-462c-970d-5293975acb17,10a45197-642a-4b20-b9d8-1ae89edf77cc',
      })
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'a6d6dbaf-9dc8-443d-acb4-5b52dd919f11',
        )
        .click()
      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('a6d6dbaf-9dc8-443d-acb4-5b52dd919f11', 'offence-outcome').click()
      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.continueButton().click()
      const cannotChangeSentenceOutcomePage = Page.verifyOnPage(CannotChangeSentenceOutcomePage)
      cannotChangeSentenceOutcomePage
        .appearanceDetails()
        .getListItems()
        .should('deep.equal', [
          'Case  CASE123 at Accrington Youth Court on 17/05/2002',
          'Case  at Southampton Magistrate Court on 28/01/2010',
        ])
    })

    it('Fine amount should not be displayed if the sentence type is changed from FINE to any other', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
        description: 'Imprisonment in Default of Fine',
        classification: 'FINE',
      })
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubSearchSentenceTypes', {
        convictionDate: '2024-09-12',
        offenceDate: '2023-12-10',
        age: '59',
      })
      cy.task('stubGetSentenceTypesByIds', [
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
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '8cb559d1-b9e9-4c60-8ef7-f40abf368196',
        )
        .click()
      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')

      offenceEditOffencePage.editFieldLink('8cb559d1-b9e9-4c60-8ef7-f40abf368196', 'sentence-type').click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceEditSentenceTypePage)
      offenceSentenceTypePage.radioLabelSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').click()
      offenceSentenceTypePage.continueButton().click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage.yearsInput().type('1')
      offencePeriodLengthPage.continueButton().click()

      offenceEditOffencePage.continueButton().click()

      // Fine amount is no longer displayed
      courtCaseAppearanceDetailsPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '4 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Forthwith',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '14/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'A Nomis sentence type',
            'Sentence length': '1 years 2 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Consecutive to count 3',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Imprisonment',
            'Sentence type': 'EDS (Extended Determinate Sentence)',
            'Custodial term': '1 years 0 months 0 weeks 0 days',
            'Licence period': '2 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Consecutive to count 1',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '10/12/2023',
            'Conviction date': '12/09/2024',
            Outcome: 'Imprisonment',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
        ])
    })

    it('should come back to appearance page when clicked back on overall case outcome page', () => {
      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'overall-case-outcome?backTo=sentencingCourtAppearance',
          true,
        )
        .click()
      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Edit the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.backLink().click()
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })
  })

  context('legacy sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetLegacySentenceAppearanceDetails')
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
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3f20856f-fa17-493b-89c7-205970c749b8/sentencing/appearance-details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('appearance details are correct', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'BB7937',
        'Warrant date': '27/01/2025',
        Location: 'Southampton Magistrate Court',
        'Overall case outcome': 'A Nomis description',
      })
    })

    it('can edit an unsupported period length', () => {
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          'b2565181-6066-4b55-b4a7-32c2ddf8c36d',
        )
        .click()

      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editPeriodLengthLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          'b2565181-6066-4b55-b4a7-32c2ddf8c36d',
          'UNSUPPORTED',
        )
        .click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'Section 86 of 2000 Act')
      offencePeriodLengthPage.yearsInput().should('have.value', '2')
      offencePeriodLengthPage.yearsInput().clear().type('5')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editPeriodLengthLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          'b2565181-6066-4b55-b4a7-32c2ddf8c36d',
          'SENTENCE_LENGTH',
        )
        .click()
      offencePeriodLengthPage.yearsInput().clear().type('5')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        Outcome: 'A Nomis description',
        'Committed on': '15/12/2023',
        'Conviction date': 'Enter conviction date',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '5 years 0 months 0 weeks 0 days',
        'Section 86 of 2000 act': '5 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Concurrent',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('editing charge with legacy outcome to sentencing results in adding sentence information', () => {
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      cy.task('stubSearchSentenceTypes', {
        convictionDate: '2023-12-17',
        offenceDate: '2023-12-15',
      })
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          '9ac07cd8-dbb8-4136-87a2-002b7496fc5f',
        )
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('9ac07cd8-dbb8-4136-87a2-002b7496fc5f', 'offence-outcome').click()
      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Imprisonment').click()
      offenceOffenceOutcomePage.continueButton().click()

      const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
      offenceCountNumberPage.radioLabelSelector('true').click()
      offenceCountNumberPage.input().clear()
      offenceCountNumberPage.input().type('2')
      offenceCountNumberPage.continueButton().click()

      const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
      offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('17')
      offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('12')
      offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
      offenceConvictionDatePage.continueButton().click()

      const offenceSentenceTypePage = Page.verifyOnPage(OffenceEditSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()

      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage.yearsInput().clear().type('4')
      offencePeriodLengthPage.monthsInput().clear().type('5')
      offencePeriodLengthPage.continueButton().click()

      const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
      offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
      offenceSentenceServeTypePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 2',
        Offence: 'PS90037 An offence description',
        Outcome: 'Imprisonment',
        'Committed on': '15/12/2023',
        'Conviction date': '17/12/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Concurrent',
      })
    })

    it('should show error if sentence type is tried to add while offence date is not available', () => {
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          'b2565181-6066-4b55-b4a7-32c2ddf8c36e',
        )
        .click()

      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('b2565181-6066-4b55-b4a7-32c2ddf8c36e', 'sentence-type').click()
      offenceEditOffencePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must enter the offence date before editing a sentence type')
    })

    it('should show error if sentence type is tried to add while conviction date is not available', () => {
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          'b2565181-6066-4b55-b4a7-32c2ddf8c36d',
        )
        .click()

      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('b2565181-6066-4b55-b4a7-32c2ddf8c36d', 'sentence-type').click()
      offenceEditOffencePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must enter the conviction date before editing a sentence type')
    })
  })
})
