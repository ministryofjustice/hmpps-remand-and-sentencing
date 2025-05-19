import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import SentenceSentenceConsecutiveToPage from '../pages/sentenceSentenceConsecutiveToPage'

context('Sentence consecutive to Page', () => {
  let sentenceSentenceConsecutiveToPage: SentenceSentenceConsecutiveToPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetSentenceTypeById', {})
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
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetSentencesToChainTo')
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetOffencesByCodes', {})

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/offences/1/sentence-consecutive-to')
    sentenceSentenceConsecutiveToPage = Page.verifyOnPage(SentenceSentenceConsecutiveToPage)
  })

  it('displays person details', () => {
    sentenceSentenceConsecutiveToPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    sentenceSentenceConsecutiveToPage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    sentenceSentenceConsecutiveToPage.continueButton().click()
    sentenceSentenceConsecutiveToPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select the sentence that this sentence is consecutive to')
  })
})
