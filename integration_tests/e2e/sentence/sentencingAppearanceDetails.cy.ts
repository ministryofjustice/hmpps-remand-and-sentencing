import CourtCaseAppearanceDetailsPage from '../../pages/courtCaseAppearanceDetailsPage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import Page from '../../pages/page'
import SentencingSentenceLengthMismatchPage from '../../pages/sentencingSentenceLengthMismatchPage'
import AppearanceUpdatedConfirmationPage from '../../pages/appearanceUpdatedConfirmationPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseAlternativeSentenceLengthPage from '../../pages/courtCaseAlternativeSentenceLengthPage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import CannotDeleteSentencePage from '../../pages/cannotDeleteSentencePage'
import SentencingDeleteSentenceInChainPage from '../../pages/sentencingDeleteSentenceInChainPage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import OffenceEditSentenceTypePage from '../../pages/offenceEditSentenceTypePage'

context('Sentencing appearance details Page', () => {
  let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
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
      cy.task('stubGetAppearanceOutcomeById', {
        outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
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
      cy.task('stubOverallSentenceLengthPass')
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
      })
    })

    it('overall displays correctly', () => {
      courtCaseAppearanceDetailsPage.overallSummaryList().getSummaryList().should('deep.equal', {
        'Overall sentence length': '4 years 0 months 0 weeks 0 days',
        'Sentences added': '0 years 0 months 0 weeks 0 days',
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
            'Custodial term': '1 years 0 months 0 weeks 0 days',
            'Licence period': '2 years 0 months 0 weeks 0 days',
            'Sentence type': 'EDS (Extended Determinate Sentence)',
            'Consecutive or concurrent': 'Consecutive to count 1',
          },
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
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '0')
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editPeriodLengthLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '0',
          'CUSTODIAL_TERM',
        )
        .click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().should('have.value', '1')
      offencePeriodLengthPage.yearsInput().clear()
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 3',
        Offence: 'PS90037 An offence description',
        Outcome: 'Remanded in custody',
        'Committed on': '15/12/2023',
        'Conviction date': '',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '2 years 0 months 0 weeks 0 days',
        'Licence period': '2 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Consecutive',
      })
      offenceEditOffencePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.confirmButton().click()
      Page.verifyOnPage(AppearanceUpdatedConfirmationPage)
      cy.task('verifyUpdateSentenceCourtAppearanceRequest').should('equal', 1)
    })

    it('display sentence mismatch when sentence length comparison fails', () => {
      cy.task('stubGetSentenceAppearanceDetailsSupportedSentenceLengthsForMismatch')
      cy.task('stubOverallSentenceLengthFail')
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
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/load-appearance-details',
      )
      courtCaseAppearanceDetailsPage.confirmButton().click()
      Page.verifyOnPage(SentencingSentenceLengthMismatchPage)
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
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {})
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
          '0',
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
          '1',
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

    it('cannot delete an offence when there is are sentences after', () => {
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuid: 'b0f83d31-efbe-462c-970d-5293975acb17',
        hasSentenceAfterOnOtherCourtAppearance: true,
      })
      cy.task('stubSentencesAfterOnOtherCourtAppearanceDetails', {})

      courtCaseAppearanceDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'sentencing',
          '0',
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
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '3')
        .click()
      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')

      offenceEditOffencePage
        .editFieldLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          'edit',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '3',
          'sentence-type',
        )
        .click()
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
            'Sentence type': 'EDS (Extended Determinate Sentence)',
            'Custodial term': '1 years 0 months 0 weeks 0 days',
            'Licence period': '2 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Consecutive to count 1',
          },
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
            'Committed on': '10/12/2023',
            'Conviction date': '12/09/2024',
            Outcome: 'Imprisonment',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Sentence length': '1 years 0 months 0 weeks 0 days',
            'Consecutive or concurrent': 'Concurrent',
          },
        ])
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
      })
    })

    it('can edit an unsupported period length', () => {
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3f20856f-fa17-493b-89c7-205970c749b8', '0')
        .click()

      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editPeriodLengthLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3f20856f-fa17-493b-89c7-205970c749b8',
          '0',
          'UNSUPPORTED',
        )
        .click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'Section 86 of 2000 Act')
      offencePeriodLengthPage.yearsInput().should('have.value', '2')
      offencePeriodLengthPage.yearsInput().clear().type('5')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        Outcome: 'A Nomis description',
        'Committed on': '15/12/2023',
        'Conviction date': '',
        'Sentence type': 'A Nomis sentence type description',
        'Section 86 of 2000 act': '5 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Unknown',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })
  })
})
