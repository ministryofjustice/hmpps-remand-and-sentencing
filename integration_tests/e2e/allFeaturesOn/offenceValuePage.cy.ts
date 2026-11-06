import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import SentenceSentenceConsecutiveToPage from '../../pages/sentenceSentenceConsecutiveToPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import Page from '../../pages/page'

import OffenceValuePage from '../../pages/offenceValuePage'

context('Add Offence Value Page', () => {
  let offenceValuePage: OffenceValuePage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)
  })

  it('submitting without selecting yes or no results in error', () => {
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage.errorSummary().trimTextContent().should('equal', 'There is a problem You must select an option.')
  })

  it('selecting yes without entering a value results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()

    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage.errorSummary().trimTextContent().should('equal', 'There is a problem You must enter a value.')
  })

  it('selecting no allows progress', () => {
    offenceValuePage.radioLabelSelector('false').click()

    offenceValuePage.continueButton().click()

    Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('selecting yes and entering a value allows progress', () => {
    offenceValuePage.radioLabelSelector('true').click()

    offenceValuePage.input().clear()
    offenceValuePage.input().type('1000')

    offenceValuePage.continueButton().click()

    Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('submitting a negative value results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()
    offenceValuePage.input().clear()
    offenceValuePage.input().type('-100')
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The value must be entered in a valid format, such as £21.34')
  })

  it('submitting non-numeric characters results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()
    offenceValuePage.input().clear()
    offenceValuePage.input().type('abc')
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The value must be entered in a valid format, such as £21.34')
  })

  it('clicking back on count number page returns to offence value page with formatted decimal value', () => {
    offenceValuePage.radioLabelSelector('true').click()
    offenceValuePage.input().clear()
    offenceValuePage.input().type('99.90')
    offenceValuePage.continueButton().click()

    const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.backLink().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)
    offenceValuePage.input().should('have.value', '99.90')
  })

  it('displays formatted offence value on offence card and consecutive-to radio hint', () => {
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
    cy.task('stubGetSentencesToChainTo', {
      beforeOrOnAppearanceDate: '2023-05-14',
    })
    cy.task('stubGetHasSentenceToChainTo', {
      beforeOrOnAppearanceDate: '2023-05-14',
    })
    cy.task('stubGetCourtsByIds')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('14')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()

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

    cy.createSentencedOffenceAllFeaturesOn('A1234AB', '0', '0', '0', '1', '99.90')

    const checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')
    checkOffenceAnswersPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '12/05/2023',
          Outcome: 'Imprisonment',
          'Sentence length': '4 years 5 months 0 weeks 0 days',
          'Sentence type': 'SDS (Standard Determinate Sentence)',
          'Consecutive or concurrent': 'Forthwith',
          'Conviction date': '13/05/2023',
          Value: '£99.90',
        },
      ])

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/1/sentence-consecutive-to')
    const sentenceConsecutiveToPage = Page.verifyOnPage(SentenceSentenceConsecutiveToPage)
    sentenceConsecutiveToPage.radioLabelContains('Value £99.90').should('exist')
  })
})
