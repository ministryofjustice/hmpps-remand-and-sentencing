import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import Page from '../pages/page'

context('Add Offence Sentence Type Page', () => {
  let offenceSentenceTypePage: OffenceSentenceTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/sentence-type')
    offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
  })

  it('displays person details', () => {
    offenceSentenceTypePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceTypePage.button().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    offenceSentenceTypePage.button().click()
    offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the sentence type')
  })
})
