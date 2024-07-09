import CourtCaseDetailsPage from '../pages/courtCaseDetailsPage'
import Page from '../pages/page'

context('Court Case details Page', () => {
  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
  })

  context('Latest remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseRemandLatest')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Birmingham Crown Court',
      )
    })

    it('displays person details', () => {
      courtCaseDetailsPage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('appearances summary shows correct data', () => {
      courtCaseDetailsPage.appearancesSummaryList().getSummaryList().should('deep.equal', {
        'Case references': 'C894623, F23325',
        'Overall case outcome': 'Remand in Custody (Bail Refused)',
        'Next hearing date': '15 12 2024',
      })
    })
  })

  // context('sentence appearance', () => {
  //   beforeEach(() => {
  //     cy.task('stubGetSentenceAppearanceDetails')
  //     cy.signIn()
  //     cy.visit(
  //       '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/details',
  //     )
  //     courtCaseDetailsPage = Page.verifyOnPageTitle(
  //       CourtCaseDetailsPage,
  //       'Edit appearance C894623 at Birmingham Crown Court on 15 12 2023',
  //     )
  //   })

  //   it('appearance summary shows correct data', () => {
  //     courtCaseDetailsPage.appearanceSummaryList().getSummaryList().should('deep.equal', {
  //       'Case reference': 'C894623',
  //       'Warrant date': '15 12 2023',
  //       'Court name': 'Birmingham Crown Court',
  //       'Overall case outcome': 'Imprisonment',
  //       'Overall sentence length': '4 years',
  //     })
  //   })
  // })
})
