import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'

context('Add Offence Offence Code Page', () => {
  let offenceOffenceCodePage: OffenceOffenceCodePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/offence-code')
    offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
  })

  it('displays person details', () => {
    offenceOffenceCodePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceCodePage.button().should('contain.text', 'Continue')
  })

  it('checking the checkbox after typing the input clears the input', () => {
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.checkboxLabelSelector('true').click()
    offenceOffenceCodePage.input().should('be.empty')
  })

  it('typing in the input after checking the checkbox clears the checkbox', () => {
    offenceOffenceCodePage.checkboxLabelSelector('true').click()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.unknownCodeCheckbox().should('not.be.checked')
  })
  it('submitting a code which does not exist results in error', () => {
    cy.task('stubGetOffenceByCodeNotFound')
    offenceOffenceCodePage.input().type('AB12345')
    offenceOffenceCodePage.button().click()
    offenceOffenceCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid offence code.')
  })
  it('submitting without entering a code or ticking the box results in error', () => {
    offenceOffenceCodePage.button().click()
    offenceOffenceCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the offence code')
  })
})
