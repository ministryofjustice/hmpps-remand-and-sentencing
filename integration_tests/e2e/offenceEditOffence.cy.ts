import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffencePeriodLengthPage from '../pages/offencePeriodLengthPage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import OffenceTerrorRelatedPage from '../pages/offenceTerrorRelatedPage'
import Page from '../pages/page'

context('Add Offence Edit offence Page', () => {
  let offenceEditOffencePage: OffenceEditOffencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.signIn()
    cy.createCourtCase('A1234AB', '0', '0')
  })

  context('remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.button().click()
      cy.createOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '', 'offences')
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
      cy.task('stubGetSentenceTypeById', {})
      cy.task('stubGetSentenceTypesByIds')
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.button().click()
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage(1, '', 'sentences')
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
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'count-number').click()
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
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit offence date and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'offence-date').click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').should('have.value', '12')
      offenceOffenceDatePage.monthDateInput('offenceStartDate').should('have.value', '5')
      offenceOffenceDatePage.yearDateInput('offenceStartDate').should('have.value', '2023')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear()
      offenceOffenceDatePage.dayDateInput('offenceStartDate').type('25')
      offenceOffenceDatePage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description Terror-related',
        'Commited on': '25 05 2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit offence and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'offence-code').click()
      cy.task('stubGetOffenceByCode', { offenceCode: 'AB11000', offenceDescription: 'Another offence description' })
      cy.task('stubGetOffencesByCodes', { offenceCode: 'AB11000', offenceDescription: 'Another offence description' })
      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().should('have.value', 'PS90037')
      offenceOffenceCodePage.input().clear()
      offenceOffenceCodePage.input().type('AB11000')
      offenceOffenceCodePage.button().click()

      const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
      offenceOffenceCodeConfirmPage.button().click()

      const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
      offenceTerrorRelatedPage.radioSelector('true').should('be.checked')
      offenceTerrorRelatedPage.radioLabelSelector('false').click()
      offenceTerrorRelatedPage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'AB11000 Another offence description',
        'Commited on': '12 05 2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit sentence length and return to edit page', () => {
      offenceEditOffencePage.editPeriodLengthLink('A1234AB', 'add', '0', '0', '0', 'SENTENCE_LENGTH').click()
      const offencePeriodLengthPage = Page.verifyOnPage(OffencePeriodLengthPage)
      offencePeriodLengthPage.yearsInput().should('have.value', '4')
      offencePeriodLengthPage.yearsInput().clear()
      offencePeriodLengthPage.yearsInput().type('6')
      offencePeriodLengthPage.monthsInput().should('have.value', '5')
      offencePeriodLengthPage.monthsInput().clear()
      offencePeriodLengthPage.monthsInput().type('6')
      offencePeriodLengthPage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description Terror-related',
        'Commited on': '12 05 2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '6 years 6 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit sentence serve type and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'sentence-serve-type').click()
      const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
      offenceSentenceServeTypePage.radioSelector('FORTHWITH').should('be.checked')
      offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
      offenceSentenceServeTypePage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description Terror-related',
        'Commited on': '12 05 2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Concurrent',
      })
    })

    it('can edit sentence type and return to edit page', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
        description: 'EDS (Extended Determinate Sentence)',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'sentence-type').click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioSelector('467e2fa8-fce1-41a4-8110-b378c727eed3').should('be.checked')
      offenceSentenceTypePage.radioLabelContains('EDS (Extended Determinate Sentence)').click()
      offenceSentenceTypePage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description Terror-related',
        'Commited on': '12 05 2023',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Sentence length': '4 years 5 months',
        'Consecutive or concurrent': 'Forthwith',
      })
    })
  })
})
