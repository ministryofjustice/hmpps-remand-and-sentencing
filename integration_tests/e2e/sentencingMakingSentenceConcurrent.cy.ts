import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceSentenceServeTypePage from '../pages/offenceSentenceServeTypePage'
import Page from '../pages/page'
import SentencingMakingSentenceConcurrentPage from '../pages/sentencingMakingSentenceConcurrentPage'

context('Sentencing making sentence concurrent Page', () => {
  let sentencingMakingSentenceConcurrentPage: SentencingMakingSentenceConcurrentPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.task('stubGetSentenceTypeById', {})
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
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
    cy.task('stubGetSentencesToChainTo')
    cy.task('stubGetCourtsByIds')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 2 offence')
    offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
    const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'sentence-serve-type').click()
    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
    offenceSentenceServeTypePage.continueButton().click()
    sentencingMakingSentenceConcurrentPage = Page.verifyOnPage(SentencingMakingSentenceConcurrentPage)
  })

  it('displays person details', () => {
    sentencingMakingSentenceConcurrentPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    sentencingMakingSentenceConcurrentPage.continueButton().should('contain.text', 'Yes, make the sentence concurrent')
  })
})

context('Check offence answers page after making concurrent', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
    cy.task('stubGetSentenceTypeById', {})
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
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
    cy.task('stubGetSentencesToChainTo')
    cy.task('stubGetCourtsByIds')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1')
  })

  it('Check offence answers page after the last sentence is made concurrent', () => {
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3', '1|SAME')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offences')
    offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '2').click()
    const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '2', 'sentence-serve-type').click()
    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
    offenceSentenceServeTypePage.continueButton().click()
    offenceEditOffencePage.continueButton().click()
    offenceCheckOffenceAnswersPage.checkConsecutiveOrConcurrentForCount(3, 'Concurrent')
  })
})
