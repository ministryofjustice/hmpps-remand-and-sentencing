import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import Page from '../../pages/page'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'

context('Add Offence Sentence Serve Type Page', () => {
  let offenceSentenceServeTypePage: OffenceSentenceServeTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-serve-type')
    offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
  })

  it('submitting without selecting an option results in error', () => {
    offenceSentenceServeTypePage.continueButton().click()
    offenceSentenceServeTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the consecutive or concurrent')
  })

  it('creating a sentenced offence with forthwith removes the option when going back on the page', () => {
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
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
    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPageSentencing)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().trimTextContent().should('equal', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/sentence-serve-type')
    offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    offenceSentenceServeTypePage.radioSelector('FORTHWITH').should('not.exist')
  })
})
