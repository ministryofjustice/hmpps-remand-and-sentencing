import OffenceOffenceNamePage from '../pages/offenceOffenceNamePage'
import Page from '../pages/page'

context('Add Offence Offence Name Page', () => {
  let offenceOffenceNamePage: OffenceOffenceNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchOffenceByName')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/offence-name')
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
  })

  it('displays person details', () => {
    offenceOffenceNamePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceNamePage.button().should('contain.text', 'Continue')
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceOffenceNamePage.button().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the offence')
  })

  it('submitting an invalid offence results in an error', () => {
    offenceOffenceNamePage.autoCompleteInput().type('an invalid offence')
    offenceOffenceNamePage.button().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid offence.')
  })
})
