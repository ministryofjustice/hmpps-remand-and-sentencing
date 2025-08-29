import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import Page from '../../pages/page'
import SentencingMakingSentenceConcurrentPage from '../../pages/sentencingMakingSentenceConcurrentPage'
import SentencingMakingSentenceForthwithPage from '../../pages/sentencingMakingSentenceForthwithPage'

context('Check offence answers page after making forthwith', () => {
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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    cy.task('stubHasLoopInChain')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1', '2', '0|SAME')
  })

  it('Check that intercept fires after changing sentence to forthwith - also check offence card displays correctly', () => {
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3', '1|SAME')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offences')
    cy.get('[data-qa^="edit-offence-link-"]')
      .eq(0)
      .then($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
          const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
          offenceEditOffencePage.editFieldLink(chargeUuid, 'sentence-serve-type').click()
          const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
          offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
          offenceSentenceServeTypePage.continueButton().click()
          const sentencingMakingSentenceConcurrentPage = Page.verifyOnPage(SentencingMakingSentenceConcurrentPage)
          sentencingMakingSentenceConcurrentPage.continueButton().click()

          offenceEditOffencePage.editFieldLink(chargeUuid, 'sentence-serve-type').click()
          offenceSentenceServeTypePage.radioLabelSelector('FORTHWITH').click()
          offenceSentenceServeTypePage.continueButton().click()

          const sentencingMakingSentenceForthwithPage = Page.verifyOnPage(SentencingMakingSentenceForthwithPage)
          sentencingMakingSentenceForthwithPage.continueButton().click()
          offenceEditOffencePage.continueButton().click()
          offenceCheckOffenceAnswersPage.checkConsecutiveOrConcurrentForCount(1, 'Forthwith')
        }
      })
  })
})
