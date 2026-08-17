import HearingUpdatedConfirmationPage from '../../pages/HearingUpdatedConfirmationPage'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import Page from '../../pages/page'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CannotDeleteSentencePage from '../../pages/cannotDeleteSentencePage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'

context('Breach appearance details Page', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes', [
      {
        outcomeUuid: 'e022f78a-016a-4e11-905b-66a1fee27584',
        outcomeName: 'DTO',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetCourtsByIds')
  })
  context('breach of supervision', () => {
    beforeEach(() => {
      cy.task('stubGetBreachAppearanceDetails')
      cy.task('stubGetOffencesByCodes', {})
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/94608b2e-c532-4cea-bae7-57bfff4566cb/breach/hearing-details',
      )
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    })

    it('hearing summary shows correct data', () => {
      courtCaseHearingDetailsPage.hearingSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Breach hearing date': '15/12/2023',
        'Court name': 'Accrington Youth Court',
        'Breach of supervision requirements': '0 years 0 months 0 weeks 41 days',
      })
    })

    it('displays offences correctly', () => {
      courtCaseHearingDetailsPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': 'Not entered',
            Outcome: 'DTO',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2025',
            Outcome: 'DTO',
          },
        ])
      courtCaseHearingDetailsPage.nonCustodialHeading().should('not.exist')
    })

    it('can submit changes to API', () => {
      cy.task('stubCreateCourtAppearance')
      cy.task('stubGetLatestCourtAppearanceWithAppeal', {})
      cy.task('stubGetCourtById', {})
      courtCaseHearingDetailsPage
        .editFieldLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          '94608b2e-c532-4cea-bae7-57bfff4566cb',
          'reference',
        )
        .click()
      const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Edit case reference')
      courtCaseReferencePage.noCaseReferenceCheckbox().should('not.be.checked')
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.continueButton().click()
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
      courtCaseHearingDetailsPage.confirmButton().click()
      Page.verifyOnPage(HearingUpdatedConfirmationPage)
      cy.task('verifyUpdateBreachCourtAppearanceRequest').should('equal', 1)
    })
  })

  context('breach of imprisonable offence', () => {
    beforeEach(() => {
      cy.task('stubGetBreachImprisonableOffenceAppearanceDetails')
      cy.task('stubGetSentenceTypesByIds', [
        {
          sentenceTypeUuid: 'cab9e914-e0de-48d0-9e72-0e1fc9a19cf4',
          description: 'DTO',
          classification: 'DTO',
        },
      ])
      cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
        sentenceUuids: 'a3902e94-a098-446a-a16e-7946044c57e0',
        hasSentenceAfterOnOtherCourtAppearance: false,
      })
      cy.task('stubGetOffencesByCodes', {
        offenceCode: 'SE20538',
        offenceDescription: 'An offence description',
        legacyOffenceCode: 'PS90037',
      })
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/bff8834a-bb17-4e2b-8336-32505be88c3a/breach/hearing-details',
      )
      courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    })

    it('hearing summary shows correct data', () => {
      courtCaseHearingDetailsPage.hearingSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Breach hearing date': '15/12/2023',
        'Court name': 'Accrington Youth Court',
        'Breach due to imprisonable offence': '0 years 3 months 0 weeks 0 days',
      })
    })

    it('cannot delete an offence when there are sentences after', () => {
      cy.task('stubGetSentenceDeleteStatus', {
        sentenceUuid: 'a3902e94-a098-446a-a16e-7946044c57e0',
        sentenceUuidsInChain: 'a3902e94-a098-446a-a16e-7946044c57e0',
        status: 'NOT_SUPPORTED',
        reasons: [
          {
            reason: 'HAS_SENTENCES_AFTER_ON_OTHER_COURT_APPEARANCE',
          },
        ],
      })
      cy.task('stubSentencesAfterOnOtherCourtAppearanceDetails', {
        sentenceUuids: 'a3902e94-a098-446a-a16e-7946044c57e0',
      })

      courtCaseHearingDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          'bff8834a-bb17-4e2b-8336-32505be88c3a',
          'breach',
          '7752d0c5-38bf-4528-b5cb-5bf23dfdc350',
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

    it('only edit user entered fields on generated breach offence', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'cab9e914-e0de-48d0-9e72-0e1fc9a19cf4',
        description: 'DTO',
        classification: 'DTO',
      })
      courtCaseHearingDetailsPage
        .editOffenceLink(
          'A1234AB',
          'fa078b3d-7c29-4f61-8120-b40b16ed9633',
          'bff8834a-bb17-4e2b-8336-32505be88c3a',
          '7752d0c5-38bf-4528-b5cb-5bf23dfdc350',
        )
        .click()
      const editOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      editOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        Offence: 'SE20538 An offence description',
        'Committed on': '10/10/2023',
        Outcome: 'DTO',
        'Sentence type': 'DTO',
        'Breach due to imprisonable offence': '0 years 3 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Concurrent',
      })
    })
  })
})
