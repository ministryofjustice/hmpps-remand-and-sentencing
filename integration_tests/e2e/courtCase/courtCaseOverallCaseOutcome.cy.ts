import CourtCaseCaseOutcomeAppliedAllPage from '../../pages/courtCaseCaseOutcomeAppliedAllPage'
import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import Page from '../../pages/page'

context('Court Case Overall Case Outcome Page', () => {
  let courtCaseOverallCaseOutcomePage: CourtCaseOverallCaseOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetAppearanceOutcomeById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-case-outcome')
    courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
  })

  it('submitting without selecting anything results in an error', () => {
    courtCaseOverallCaseOutcomePage.continueButton().click()
    courtCaseOverallCaseOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the overall case outcome')
  })

  it('after confirm and continue check answers this becomes uneditable', () => {
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/overall-case-outcome')
    courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.continueButton().click()
    courtCaseOverallCaseOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You cannot submit after confirming appearance information')
  })
})
