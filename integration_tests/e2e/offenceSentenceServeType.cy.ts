import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import Page from '../pages/page'

context('Add Offence Sentence Serve Type Page', () => {
  let offenceSentenceServeTypePage: OffenceSentenceServeTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/sentence-serve-type')
    offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
  })

  it('displays person details', () => {
    offenceSentenceServeTypePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceServeTypePage.button().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    offenceSentenceServeTypePage.button().click()
    offenceSentenceServeTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the consecutive or concurrent')
  })

  it('creating a sentenced offence with forthwith removes the option when going back on the page', () => {
    cy.task('stubGetOffenceByCode')
    cy.task('stubGetOffencesByCodes')
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/1/sentence-serve-type')
    offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioSelector('FORTHWITH').should('not.exist')
  })
})
