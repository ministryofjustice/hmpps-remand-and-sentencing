import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import Page from '../pages/page'

context('Add Offence Edit offence Page', () => {
  let offenceEditOffencePage: OffenceEditOffencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode')
    cy.task('stubGetOffencesByCodes')
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
  })

  context('remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.button().click()
      cy.createOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'offences')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    })

    it('displays person details', () => {
      offenceEditOffencePage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to accept changes is displayed', () => {
      offenceEditOffencePage.button().should('contain.text', 'Accept changes')
    })
  })

  context('sentence', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.button().click()
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '0', 'sentences')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
    })

    it('displays person details', () => {
      offenceEditOffencePage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to accept changes is displayed', () => {
      offenceEditOffencePage.button().should('contain.text', 'Accept changes')
    })

    it('can edit count number and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', '0', '0', '0', 'count-number').click()
      const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
      offenceCountNumberPage.input().should('have.value', '1')
      offenceCountNumberPage.input().clear()
      offenceCountNumberPage.input().type('5')
      offenceCountNumberPage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 5',
        Offence: 'PS90037 An offence description Terror-related',
        'Commited on': '12 05 2023',
        'Sentence type': '',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })
  })
})
