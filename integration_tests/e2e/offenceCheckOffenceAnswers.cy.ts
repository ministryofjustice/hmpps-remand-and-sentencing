import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceDeleteOffencePage from '../pages/offenceDeleteOffencePage'
import Page from '../pages/page'

context('Check Offence Answers Page', () => {
  let offenceCheckOffenceAnswersPage: OffenceCheckOffenceAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.task('stubGetOffenceByCode')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0')
    cy.visit('/person/A1234AB/court-cases/0/offences/check-offence-answers')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '12345')
  })

  it('displays person details', () => {
    offenceCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceCheckOffenceAnswersPage.button().should('contain.text', 'Finish adding offences and continue')
  })

  it('deleting offence removes from list and goes back to check answers page', () => {
    cy.createOffence('A1234AB', '1', '0')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '12345')
    offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '1', '0').click()
    const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
    offenceDeleteOffencePage.radioSelector('true').click()
    offenceDeleteOffencePage.button().click()
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '12345')
  })
})
