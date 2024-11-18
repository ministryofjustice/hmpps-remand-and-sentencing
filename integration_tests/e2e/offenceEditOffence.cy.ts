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
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
  })

  context('remand', () => {
    beforeEach(() => {
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {})
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.button().click()
      cy.createOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('')
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
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.button().click()
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('')
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
        Offence: 'PS90037 An offence description',
        'Terror related': 'Yes',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
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
        Offence: 'PS90037 An offence description',
        'Terror related': 'Yes',
        'Committed on': '25/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
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

      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'AB11000 Another offence description',
        'Terror related': 'Yes',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit terror related and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', '0', '0', 'terror-related').click()
      const offenceTerrorRelatedPage = Page.verifyOnPage(OffenceTerrorRelatedPage)
      offenceTerrorRelatedPage.radioLabelSelector('false').click()
      offenceTerrorRelatedPage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Terror related': 'No',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit sentence length and return to edit page', () => {
      offenceEditOffencePage.editPeriodLengthLink('A1234AB', 'add', '0', '0', '0', 'SENTENCE_LENGTH').click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
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
        Offence: 'PS90037 An offence description',
        'Terror related': 'Yes',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '6 years 6 months 0 weeks 0 days',
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
        Offence: 'PS90037 An offence description',
        'Terror related': 'Yes',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
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
      offenceSentenceTypePage.radioSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').should('be.checked')
      offenceSentenceTypePage.radioLabelContains('EDS (Extended Determinate Sentence)').click()
      offenceSentenceTypePage.button().click()
      let offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'overall sentence length')
      offencePeriodLengthPage.yearsInput().type('6')
      offencePeriodLengthPage.monthsInput().type('6')
      offencePeriodLengthPage.button().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().type('4')
      offencePeriodLengthPage.monthsInput().type('4')
      offencePeriodLengthPage.button().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'licence period')
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.monthsInput().type('2')
      offencePeriodLengthPage.button().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'sentence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Terror related': 'Yes',
        'Committed on': '12/05/2023',
        'Conviction date': '12/05/2023',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Sentence length': '6 years 6 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })
  })
})
