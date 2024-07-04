import CourtCaseAppearanceDetailsPage from '../pages/courtCaseAppearanceDetailsPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
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
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Birmingham Crown Court on 15 12 2023',
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
        'Court name': 'Birmingham Crown Court',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
      })
    })

    it('next hearing summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.nextHearingSummaryList().getSummaryList().should('deep.equal', {
        'Next hearing set': 'Yes',
        'Court name': 'Birmingham Crown Court',
        'Hearing type': 'Court appearance',
        Date: '15 12 2024 13:55',
      })
    })

    it('can edit fields and return back to details page', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Birmingham Crown Court',
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

      const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.button().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Birmingham Crown Court on 15 12 2023',
      )
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'T12345678',
        'Warrant date': '15 12 2023',
        'Court name': 'Birmingham Crown Court',
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

      const courtCaseReferencePage = Page.verifyOnPage(CourtCaseReferencePage)
      courtCaseReferencePage.input().clear().type('T12345678')
      courtCaseReferencePage.button().click()
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance T12345678 at Birmingham Crown Court on 15 12 2023',
      )
      courtCaseAppearanceDetailsPage.button().click()
      cy.task('verifyUpdateCourtAppearanceRequest').should('equal', 1)
    })
  })

  context('sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceAppearanceDetails')
      cy.signIn()
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(
        CourtCaseAppearanceDetailsPage,
        'Edit appearance C894623 at Birmingham Crown Court on 15 12 2023',
      )
    })

    it('appearance summary shows correct data', () => {
      courtCaseAppearanceDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
        'Case reference': 'C894623',
        'Warrant date': '15 12 2023',
        'Court name': 'Birmingham Crown Court',
        'Overall case outcome': 'Imprisonment',
        'Overall sentence length': '4 years',
      })
    })
  })
})
