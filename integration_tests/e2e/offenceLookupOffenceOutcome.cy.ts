import OffenceLookupOffenceOutcomePage from '../pages/offenceLookupOffenceOutcomePage'
import Page from '../pages/page'

context('Lookup offence outcome Page', () => {
  let offenceLookupOffenceOutcomePage: OffenceLookupOffenceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/lookup-offence-outcome')
    offenceLookupOffenceOutcomePage = Page.verifyOnPage(OffenceLookupOffenceOutcomePage)
  })

  it('displays person details', () => {
    offenceLookupOffenceOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceLookupOffenceOutcomePage.button().should('contain.text', 'Continue')
  })
})
