import CourtCaseAppearanceDetailsPage from '../pages/courtCaseAppearanceDetailsPage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
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
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15 12 2023',
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
      courtCaseAppearanceDetailsPage.button().should('contain.text', 'Confirm changes')
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
      })
    })

    it('next hearing summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.nextHearingSummaryList().getSummaryList().should('deep.equal', {
        'Next hearing set': 'Yes',
        'Court name': 'Birmingham Crown Court',
        'Hearing type': 'Court appearance',
        Date: '15 12 2024',
      })
    })

    it('can edit fields and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
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
      courtCaseReferencePage.captionText().contains('Appearance C894623 at Southampton Magistrate Court on 15 12 2023')
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.button().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Southampton Magistrate Court on 15 12 2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'T12345678',
        'Warrant date': '15 12 2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
      })
    })

    it('can edit court name and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
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
      courtCaseCourtNamePage.button().click()

      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Accrington Youth Court on 15 12 2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Accrington Youth Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
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
      courtCaseReferencePage.button().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Southampton Magistrate Court on 15 12 2023',
      )
      courtCaseAppearanceDetailsPage.button().click()
      cy.task('verifyUpdateCourtAppearanceRequest').should('equal', 1)
    })
  })

  context('sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15 12 2023',
      )
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Southampton Magistrate Court',
        'Overall case outcome': 'Imprisonment',
        'Overall sentence length': '4 years',
      })
    })

    it('can edit sentence information', () => {
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '0')
        .click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage
        .editFieldLink(
          'A1234AB',
          'edit',
          '83517113-5c14-4628-9133-1e3cb12e31fa',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          '0',
          'offence-date',
        )
        .click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Edit the offence dates')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').should('have.value', '15')
      offenceOffenceDatePage.monthDateInput('offenceStartDate').should('have.value', '12')
      offenceOffenceDatePage.yearDateInput('offenceStartDate').should('have.value', '2023')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
      offenceOffenceDatePage.dayDateInput('offenceStartDate').type('25')
      offenceOffenceDatePage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Commited on': '25 12 2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years',
        'Consecutive or concurrent': 'Forthwith',
      })
      offenceEditOffencePage.button().click()
      Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Southampton Magistrate Court on 15 12 2023',
      )
    })
  })
})
