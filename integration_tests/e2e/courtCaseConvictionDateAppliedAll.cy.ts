import CourtCaseConvictionDateAppliedAllPage from '../pages/courtCaseConvictionDateAppliedAllPage'
import Page from '../pages/page'

context('Court Case Conviction date applied all Page', () => {
  let courtCaseConvictionDateAppliedAllPage: CourtCaseConvictionDateAppliedAllPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-conviction-date-applied-all')
    courtCaseConvictionDateAppliedAllPage = Page.verifyOnPage(CourtCaseConvictionDateAppliedAllPage)
  })

  it('displays person details', () => {
    courtCaseConvictionDateAppliedAllPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseConvictionDateAppliedAllPage.continueButton().should('contain.text', 'Save and continue')
  })

  it('submitting without selecting anything results in error', () => {
    courtCaseConvictionDateAppliedAllPage.continueButton().click()
    courtCaseConvictionDateAppliedAllPage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem Select ‘Yes’ if this conviction date applies to all offences on the warrant.',
      )
  })
})
