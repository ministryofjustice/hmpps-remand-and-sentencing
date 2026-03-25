import CourtCaseNextAppearanceSubtypePage from '../../pages/courtCaseNextAppearanceSubtypePage'
import CourtCaseNextAppearanceTypePage from '../../pages/courtCaseNextAppearanceTypePage'
import Page from '../../pages/page'

context('Next appearance type page', () => {
  let courtCaseNextAppearanceSubtypePage: CourtCaseNextAppearanceSubtypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceTypes')
    cy.task('stubGetAllAppearanceSubtypes')
    cy.task('stubGetAppearanceTypeByUuid')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-type')
    const courtCaseNextAppearanceTypePage = Page.verifyOnPage(CourtCaseNextAppearanceTypePage)
    courtCaseNextAppearanceTypePage.radioLabelContains('Court appearance').click()
    courtCaseNextAppearanceTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/next-appearance-subtype')
    courtCaseNextAppearanceSubtypePage = Page.verifyOnPage(CourtCaseNextAppearanceSubtypePage)
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseNextAppearanceSubtypePage.continueButton().click()
    courtCaseNextAppearanceSubtypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the type of discharge')
  })

  it('caption should only be shown for add next court appearance journey', () => {
    courtCaseNextAppearanceSubtypePage.captionText().trimTextContent().should('equal', 'Add next court appearance')
  })
})
