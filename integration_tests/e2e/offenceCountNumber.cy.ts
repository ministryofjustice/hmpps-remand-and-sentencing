import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import Page from '../pages/page'

context('Add Offence Count number Page', () => {
  let offenceCountNumberPage: OffenceCountNumberPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/count-number')
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('displays person details', () => {
    offenceCountNumberPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceCountNumberPage.continueButton().should('contain.text', 'Save and continue')
  })

  it('submitting without selecting entering anything results in error', () => {
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a count number.')
  })

  it('submitting 0 results in error', () => {
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('0')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a number greater than zero.')
  })

  it('submitting a decimal results in error', () => {
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('6.5')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Enter a whole number for the count number.')
  })
})
