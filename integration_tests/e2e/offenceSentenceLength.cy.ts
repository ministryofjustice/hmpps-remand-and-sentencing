import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceSentenceLengthPage from '../pages/offenceSentenceLengthPage'
import Page from '../pages/page'

context('Add Offence Sentence Length Page', () => {
  let offenceSentenceLengthPage: OffenceSentenceLengthPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/sentence-length')
    offenceSentenceLengthPage = Page.verifyOnPage(OffenceSentenceLengthPage)
  })

  it('displays person details', () => {
    offenceSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceLengthPage.button().should('contain.text', 'Continue')
  })
})
