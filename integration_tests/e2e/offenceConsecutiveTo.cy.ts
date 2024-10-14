import OffenceConsecutiveToPage from '../pages/offenceConsecutiveToPage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import Page from '../pages/page'

context('Add Offence Consecutive to Page', () => {
  let offenceConsecutiveToPage: OffenceConsecutiveToPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/count-number')
    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.button().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/consecutive-to')
    offenceConsecutiveToPage = Page.verifyOnPageTitle(OffenceConsecutiveToPage, '1')
  })

  it('displays person details', () => {
    offenceConsecutiveToPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceConsecutiveToPage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything results in error', () => {
    offenceConsecutiveToPage.button().click()
    offenceConsecutiveToPage = Page.verifyOnPageTitle(OffenceConsecutiveToPage, '1')
    offenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the consecutive to')
  })

  it('submitting a negative number results in error', () => {
    offenceConsecutiveToPage.input().clear()
    offenceConsecutiveToPage.input().type('-5')
    offenceConsecutiveToPage.button().click()
    offenceConsecutiveToPage = Page.verifyOnPageTitle(OffenceConsecutiveToPage, '1')
    offenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Enter a whole number for the count number.')
  })

  it('submitting a decimal number results in error', () => {
    offenceConsecutiveToPage.input().clear()
    offenceConsecutiveToPage.input().type('6.2')
    offenceConsecutiveToPage.button().click()
    offenceConsecutiveToPage = Page.verifyOnPageTitle(OffenceConsecutiveToPage, '1')
    offenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Enter a whole number for the count number.')
  })
})
