import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceDeleteOffencePage from '../pages/offenceDeleteOffencePage'
import Page from '../pages/page'

context('Check Offence Answers Page', () => {
  let offenceCheckOffenceAnswersPage: OffenceCheckOffenceAnswersPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPrisonerDetails')
    cy.task('stubGetOffenceByCode')
    cy.task('stubGetOffencesByCodes')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/check-offence-answers')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '0', 'offences')
  })

  it('displays person details', () => {
    offenceCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceCheckOffenceAnswersPage.button().should('contain.text', 'Finish adding offences and continue')
  })

  context('remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.button().click()
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '0', 'offences')
    })
    it('deleting offence removes from list and goes back to check answers page', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'offences')
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '0', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Offence deleted')
    })

    it('creating a new offence results in new offence added info banner', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'New offence added')
    })
    it('changing an existing offence results in changes successfully made info banner', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Changes successfully made')
    })
  })

  context('sentencing', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.button().click()
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '0', 'sentences')
    })

    it('deleting sentence removes from list and goes back to check answers page', () => {
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'sentences')
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, '0', 'sentences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Sentence deleted')
    })

    it('creating a new sentenced offence results in new sentence added info banner', () => {
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'sentences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'New sentence added')
    })
  })
})
