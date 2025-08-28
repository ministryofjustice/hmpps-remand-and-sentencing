import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import Page from '../../pages/page'
import SentencingMakingSentenceConsecutivePage from '../../pages/sentencingMakingSentenceConsecutivePage'
import SentenceSentenceConsecutiveToPage from '../../pages/sentenceSentenceConsecutiveToPage'

context('Check offence answers page after making consecutive', () => {
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
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-05-13' })
    cy.task('stubHasLoopInChain')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0', '1')
    cy.createSentencedConcurrentOffence('A1234AB', '0', '0', '1', '2')
  })

  it('Check that intercept fires after changing sentence to consecutive (and subsequent flow) - also check offence card displays correctly', () => {
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3', '1|SAME')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offences')

    offenceCheckOffenceAnswersPage.editOffenceLink('1').click()
    const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    offenceEditOffencePage.editFieldLink('1', 'sentence-serve-type').click()
    const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioLabelSelector('CONSECUTIVE').click()
    offenceSentenceServeTypePage.continueButton().click()
    const sentencingMakingSentenceConsecutivePage = Page.verifyOnPage(SentencingMakingSentenceConsecutivePage)
    sentencingMakingSentenceConsecutivePage.continueButton().click()
    const sentenceSentenceConsecutiveToPage = Page.verifyOnPage(SentenceSentenceConsecutiveToPage)
    sentenceSentenceConsecutiveToPage.radioLabelSelector('0|SAME').click()
    sentenceSentenceConsecutiveToPage.continueButton().click()
    offenceEditOffencePage.continueButton().click()
    offenceCheckOffenceAnswersPage.checkConsecutiveOrConcurrentForCount(2, 'Consecutive to count 1')
  })
})
