import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

context('Add Offence Outcome Page', () => {
  let offenceOffenceOutcomePage: OffenceOffenceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')
  })

  it('displays person details', () => {
    offenceOffenceOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceOutcomePage.button().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in an error', () => {
    offenceOffenceOutcomePage.button().click()
    offenceOffenceOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the offence outcome')
  })
})
