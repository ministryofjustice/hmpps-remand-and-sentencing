import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceDeleteOffencePage from '../pages/offenceDeleteOffencePage'
import Page from '../pages/page'
import SentencingDeleteSentenceInChainPage from '../pages/sentencingDeleteSentenceInChainPage'

context('Sentencing delete sentence in chain Page', () => {
  let sentencingDeleteSentenceInChainPage: SentencingDeleteSentenceInChainPage
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
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 2 offence')
    offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
    const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
    offenceDeleteOffencePage.radioLabelSelector('true').click()
    offenceDeleteOffencePage.continueButton().click()
    sentencingDeleteSentenceInChainPage = Page.verifyOnPage(SentencingDeleteSentenceInChainPage)
  })

  it('displays person details', () => {
    sentencingDeleteSentenceInChainPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    sentencingDeleteSentenceInChainPage.continueButton().should('contain.text', 'Yes, delete the sentence')
  })

  it('continuing clears the whole chain', () => {
    sentencingDeleteSentenceInChainPage.continueButton().click()
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '12/05/2023',
          'Conviction date': '12/05/2023',
          Outcome: 'Imprisonment',
          'Sentence type': 'SDS (Standard Determinate Sentence)',
          'Sentence length': '4 years 5 months 0 weeks 0 days',
        },
      ])
    // this will change in RASS-1058 for consecutive or concurrent to be a link to update
  })
})
