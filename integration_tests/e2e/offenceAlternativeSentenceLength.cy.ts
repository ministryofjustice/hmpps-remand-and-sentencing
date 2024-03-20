import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceAlternativeSentenceLengthPage from '../pages/offenceAlternativeSentenceLengthPage'
import Page from '../pages/page'

context('Add Offence Alternative Sentence Length Page', () => {
  let offenceAlternativeSentenceLengthPage: OffenceAlternativeSentenceLengthPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/0/alternative-sentence-length')
    offenceAlternativeSentenceLengthPage = Page.verifyOnPage(OffenceAlternativeSentenceLengthPage)
  })

  it('displays person details', () => {
    offenceAlternativeSentenceLengthPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceAlternativeSentenceLengthPage.button().should('contain.text', 'Continue')
  })
})
