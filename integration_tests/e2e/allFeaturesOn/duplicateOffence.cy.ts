import Page from '../../pages/page'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'

context('Duplicate offence with multiple offence instances enabled', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
    cy.task('stubHasLoopInChain')
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const warrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    warrantDatePage.dayDateInput('warrantDate').type('14')
    warrantDatePage.monthDateInput('warrantDate').type('5')
    warrantDatePage.yearDateInput('warrantDate').type('2023')
    warrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-case-outcome')
    const overallOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    overallOutcomePage.radioLabelContains('Imprisonment').click()
    overallOutcomePage.continueButton().click()
    const outcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPageSentencing)
    outcomeAppliedAllPage.radioLabelSelector('false').click()
    outcomeAppliedAllPage.continueButton().click()
  })

  it('displays Duplicate this offence on each custodial offence card when the feature flag is on', () => {
    cy.createSentencedOffence('A1234AB', '0', '0', '0', '1')
    Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')

    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-05-12',
      offenceDate: '2023-05-10',
    })
    cy.createSentencedConcurrentOffence('A1234AB', '0', '0', '1', '2')
    const checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 2 offences')

    checkOffenceAnswersPage
      .custodialOffences()
      .find('.offence-card')
      .should('have.length', 2)
      .each(offenceCard => {
        const editHref = offenceCard.find('[data-qa^="edit-offence-link-"]').attr('href')

        cy.wrap(offenceCard)
          .find('[data-qa^="duplicate-offence-link-"]')
          .should('have.length', 1)
          .and('be.visible')
          .and('have.text', 'Duplicate this offence')
          .and('have.attr', 'href', editHref.replace('/load-edit-offence', '/duplicate-offence'))
      })
  })
})
