import CourtCaseAppearanceDetailsPage from '../pages/courtCaseAppearanceDetailsPage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'
import Page from '../pages/page'

context('Court Case Appearance details Page', () => {
  let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
  })

  context('remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetRemandAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {
        courtId: 'STHHPM',
        courtName: 'Southampton Magistrate Court',
      })
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetAppearanceTypeByUuid')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
    })

    it('displays person details', () => {
      courtCaseAppearanceDetailsPage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to confirm changes is displayed', () => {
      courtCaseAppearanceDetailsPage.confirmButton().should('contain.text', 'Confirm changes')
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('next hearing summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.nextHearingSummaryList().getSummaryList().should('deep.equal', {
        'Next hearing set': 'Yes',
        'Court name': 'Southampton Magistrate Court',
        'Hearing type': 'Court appearance',
        Date: '15/12/2024',
      })
    })

    it('can edit fields and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })

      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'reference',
        )
        .click()

      const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Edit case reference')
      courtCaseReferencePage.captionText().contains('Add appearance information')
      courtCaseReferencePage.noCaseReferenceCheckbox().should('not.be.checked')
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Southampton Magistrate Court on 15/12/2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'T12345678',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('can edit court name and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })

      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'court-name',
        )
        .click()

      const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'Edit the court name')
      courtCaseCourtNamePage.autoCompleteInput().clear()
      courtCaseCourtNamePage.autoCompleteInput().type('cou')
      courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
      courtCaseCourtNamePage.firstAutoCompleteOption().click()
      courtCaseCourtNamePage.continueButton().click()

      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Accrington Youth Court on 15/12/2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Accrington Youth Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('edit fields and submit stores in RAS API', () => {
      cy.task('stubUpdateCourtAppearance')
      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'reference',
        )
        .click()

      const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Edit case reference')
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Southampton Magistrate Court on 15/12/2023',
      )
      courtCaseAppearanceDetailsPage.confirmButton().click()
      cy.task('verifyUpdateCourtAppearanceRequest').should('equal', 1)
    })
  })

  context('sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {
        courtId: 'STHHPM',
        courtName: 'Southampton Magistrate Court',
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
      cy.task('stubGetAppearanceOutcomeById', {
        outcomeUuid: '4b2a225e-5bb1-4bf7-8719-6ff9f3ee0d10',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Sentencing',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall sentence length': '4 years 0 months 0 weeks 0 days',
      })
    })

    it('can edit sentence information', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: '0197d1a8-3663-432d-b78d-16933b219ec7',
        description: 'EDS (Extended Determinate Sentence)',
        classification: 'EXTENDED',
      })
      cy.task('stubGetChargeOutcomeById', {})
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
        'Committed on': '15/12/2023',
        'Conviction date': 'N/A',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '2 years 0 months 0 weeks 0 days',
        'Overall sentence length': '2 years 0 months 0 weeks 0 days',
        'Licence period': '2 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Consecutive to count 1',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
    })
  })

  context('legacy remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetLegacyAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {
        courtId: 'STHHPM',
        courtName: 'Southampton Magistrate Court',
      })
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetAppearanceTypeByUuid')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
    })

    it('can edit overall outcome and return back to details page', () => {
      cy.task('stubGetAllAppearanceOutcomes')
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'A Nomis description',
      })

      courtCaseAppearanceDetailsPage
        .editFieldLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'overall-case-outcome',
        )
        .click()
      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Edit the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.legendParagraph().should('contain', 'A Nomis description')
      courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
      courtCaseOverallCaseOutcomePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Remand',
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('can edit offence outcome and return back to details page', () => {
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubGetAllChargeOutcomes')
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '1')
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editFieldLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '1',
          'offence-outcome',
        )
        .click()
      const offenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Edit the outcome for this offence')
      offenceOutcomePage.legendParagraph().should('contain', 'A Nomis description')
      offenceOutcomePage.radioLabelContains('Remanded in custody').click()
      offenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': '15/12/2023',
        Outcome: 'Remanded in custody',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15/12/2023',
      )
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
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3f20856f-fa17-493b-89c7-205970c749b8/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance BB7937 at Southampton Magistrate Court on 27/01/2025',
      )
    })

    it('appearance details are correct', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Warrant type': 'Sentencing',
        'Case reference': 'BB7937',
        'Warrant date': '27/01/2025',
        'Court name': 'Southampton Magistrate Court',
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
        'Committed on': '15/12/2023',
        'Conviction date': 'N/A',
        'Sentence type': 'A Nomis sentence type description',
        'Section 86 of 2000 act': '5 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Unknown',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance BB7937 at Southampton Magistrate Court on 27/01/2025',
      )
    })
  })
})
