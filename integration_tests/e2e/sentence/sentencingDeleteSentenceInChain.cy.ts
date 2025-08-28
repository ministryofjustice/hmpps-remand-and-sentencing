import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import Page from '../../pages/page'
import SentencingDeleteSentenceInChainPage from '../../pages/sentencingDeleteSentenceInChainPage'

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
    cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-05-13' })
    cy.task('stubGetCourtsByIds')
    cy.task('stubHasLoopInChain')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 2 offence')
    offenceCheckOffenceAnswersPage
      .deleteOffenceLink('A1234AB', '0', '0', 'f6053bf3-9f08-45c1-9aa9-66bf0bb2ad52')
      .click()
    const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
    offenceDeleteOffencePage.deleteButton().click()
    sentencingDeleteSentenceInChainPage = Page.verifyOnPage(SentencingDeleteSentenceInChainPage)
  })

  it('continuing clears the whole chain', () => {
    sentencingDeleteSentenceInChainPage.continueButton().click()
    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '10/05/2023',
          'Conviction date': '12/05/2023',
          Outcome: 'Imprisonment',
          'Sentence type': 'SDS (Standard Determinate Sentence)',
          'Sentence length': '4 years 5 months 0 weeks 0 days',
          'Consecutive or concurrent': 'Select consecutive or current',
        },
      ])
    offenceCheckOffenceAnswersPage.selectConsecutiveConcurrentLink('A1234AB', '0', '0', '0').click()
    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
    offenceSentenceServeTypePage.continueButton().click()
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    offenceCheckOffenceAnswersPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '10/05/2023',
          'Conviction date': '12/05/2023',
          Outcome: 'Imprisonment',
          'Sentence type': 'SDS (Standard Determinate Sentence)',
          'Sentence length': '4 years 5 months 0 weeks 0 days',
          'Consecutive or concurrent': 'Concurrent',
        },
      ])
  })
})
