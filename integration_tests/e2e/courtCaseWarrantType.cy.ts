import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import Page from '../pages/page'

context('Warrant type page', () => {
  let courtCaseWarrantTypePage: CourtCaseWarrantTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
  })

  it('submitting without selecting anything results in error', () => {
    courtCaseWarrantTypePage.continueButton().click()
    courtCaseWarrantTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the type of warrant')
  })
})
