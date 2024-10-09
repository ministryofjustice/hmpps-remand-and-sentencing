import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceDeleteOffencePage from '../pages/offenceDeleteOffencePage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

context('Check Offence Answers Page', () => {
  let offenceCheckOffenceAnswersPage: OffenceCheckOffenceAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtById', {})
    cy.task('stubGetSentenceTypesByIds')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetChargeOutcomesByIds', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.button().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'offences')
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
    offenceCheckOffenceAnswersPage.button().should('contain.text', 'Accept and continue')
  })

  context('remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.button().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'offences')
    })
    it('deleting offence removes from list and goes back to check answers page', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPageTitle(OffenceDeleteOffencePage, 'offence')
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Offence deleted')
    })

    it('creating a new offence results in new offence added info banner', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'New offence added')
    })
    it('changing an existing offence results in changes successfully made info banner', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'offence-outcome').click()
      const offenceOffenceOutcomePage = Page.verifyOnPage(OffenceOffenceOutcomePage)
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Changes successfully made')
    })

    it('going to edit offence page and making no change results in no info banner', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'offences')
      offenceCheckOffenceAnswersPage.infoBanner().should('not.exist')
    })
  })

  context('sentencing', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceTypeById', {})
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.button().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'sentences')
    })

    it('deleting sentence removes from list and goes back to check answers page', () => {
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'sentences')
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPageTitle(OffenceDeleteOffencePage, 'sentence')
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.button().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(0, 'T12345678', 'sentences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'Sentence deleted')
    })

    it('creating a new sentenced offence results in new sentence added info banner', () => {
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'sentences')
      offenceCheckOffenceAnswersPage.infoBanner().should('contain.text', 'New sentence added')
    })

    it('deleting sentence and not selecting yes or no results in error', () => {
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, 'T12345678', 'sentences')
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPageTitle(OffenceDeleteOffencePage, 'sentence')
      offenceDeleteOffencePage.button().click()
      offenceDeleteOffencePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must select whether you want to delete this sentence')
    })
  })
})
