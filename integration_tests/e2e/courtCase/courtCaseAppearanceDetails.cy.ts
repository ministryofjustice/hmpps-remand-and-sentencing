import AppearanceUpdatedConfirmationPage from '../../pages/appearanceUpdatedConfirmationPage'
import CourtCaseAppearanceDetailsPage from '../../pages/courtCaseAppearanceDetailsPage'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import Page from '../../pages/page'

context('Court Case Appearance details Page', () => {
  let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes')
  })

  context('remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetRemandAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {
        courtId: 'STHHPM',
        courtName: 'Southampton Magistrate Court',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      })
      cy.task('stubGetAppearanceTypeByUuid')
      cy.task('stubGetAllAppearanceOutcomes')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/remand/appearance-details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('displays person details', () => {
      courtCaseAppearanceDetailsPage
        .prisonerBanner()
        .should('contain.text', 'Meza, Cormac')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to confirm changes is displayed', () => {
      courtCaseAppearanceDetailsPage.confirmButton().should('contain.text', 'Confirm changes')
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('next hearing summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.nextHearingSummaryList().getSummaryList().should('deep.equal', {
        'Next hearing set': 'Yes',
        Location: 'Southampton Magistrate Court',
        'Hearing type': 'Court appearance',
        Date: '15/12/2024',
      })
    })

    it('displays offences correctly', () => {
      courtCaseAppearanceDetailsPage
        .allOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Remanded in custody',
            'Merged from': 'C894623 at Southampton Magistrate Court',
          },
        ])
    })

    it('can edit fields and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
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
      courtCaseReferencePage.noCaseReferenceCheckbox().should('not.be.checked')
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.appearanceDetailsSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Court name': 'Southampton Magistrate Court',
        'Warrant date': '15/12/2023',
        'Overall case outcome': 'Remanded in custody',
      })
      courtCaseReferencePage.continueButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'T12345678',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('can edit court name and return back to details page', () => {
      cy.task('stubGetCourtById', {
        courtId: 'ACCRYC',
        courtName: 'Accrington Youth Court',
      })
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
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
      courtCaseCourtNamePage.appearanceDetailsSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Court name': 'Southampton Magistrate Court',
        'Warrant date': '15/12/2023',
        'Overall case outcome': 'Remanded in custody',
      })
      courtCaseCourtNamePage.autoCompleteInput().clear()
      courtCaseCourtNamePage.autoCompleteInput().type('cou')
      courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
      courtCaseCourtNamePage.firstAutoCompleteOption().click()
      courtCaseCourtNamePage.continueButton().click()

      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Accrington Youth Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('edit fields and submit stores in RAS API', () => {
      cy.task('stubUpdateCourtAppearance')
      cy.task('stubGetLatestCourtAppearance', { courtCaseUuid: '83517113-5c14-4628-9133-1e3cb12e31fa' })
      cy.task('stubGetCourtById', {})
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
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.confirmButton().click()
      Page.verifyOnPage(AppearanceUpdatedConfirmationPage)
      cy.task('verifyUpdateCourtAppearanceRequest').should('equal', 1)
    })

    it('can add another offence and go back to appearance details', () => {
      courtCaseAppearanceDetailsPage.addAnotherButton().click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').type('12')
      offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
      offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
      offenceOffenceDatePage.continueButton().click()

      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('PS90037')
      offenceOffenceCodePage.continueButton().click()

      const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
      offenceOffenceCodeConfirmPage.continueButton().click()

      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Remanded in custody').click()
      offenceOffenceOutcomePage.continueButton().click()

      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage
        .allOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '15/12/2023',
            Outcome: 'Remanded in custody',
            'Merged from': 'C894623 at Southampton Magistrate Court',
          },
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '12/05/2023',
            Outcome: 'Remanded in custody',
          },
        ])
    })

    it('can delete an offence', () => {
      courtCaseAppearanceDetailsPage
        .deleteOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'remand',
          '71bb9f7e-971c-4c34-9a33-43478baee74f',
        )
        .click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.allOffences().getOffenceCards().should('deep.equal', [])
    })

    it('displays merged from cases correctly', () => {
      courtCaseAppearanceDetailsPage
        .mergedCaseInset()
        .should(
          'contain.text',
          'This appearance includes offences from C894623 that were merged with this case on 15/12/2023',
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
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetAppearanceTypeByUuid')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/remand/appearance-details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('can edit overall outcome and return back to details page', () => {
      cy.task('stubGetAllAppearanceOutcomes')
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
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
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15/12/2023',
        Location: 'Southampton Magistrate Court',
        'Overall case outcome': 'Remanded in custody',
      })
    })

    it('can edit offence outcome and return back to details page', () => {
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubGetAllChargeOutcomes')
      courtCaseAppearanceDetailsPage
        .editOffenceLink(
          'A1234AB',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '9b622879-8191-4a7f-9fe8-71b680417220',
        )
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('9b622879-8191-4a7f-9fe8-71b680417220', 'offence-outcome').click()
      const offenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOutcomePage.radioLabelContains('Remanded in custody').click()
      offenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editSummaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': 'Not entered',
        Outcome: 'Remanded in custody',
      })
      offenceEditOffencePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })
  })
})
