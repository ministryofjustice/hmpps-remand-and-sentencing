import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import Page from '../../pages/page'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import IsOffenceDateSamePage from '../../pages/IsOffenceDateSamePage'

context('Is Offence Date Same Page', () => {
  let isOffenceDateSamePage: IsOffenceDateSamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtById', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('14')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
    const overallOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    overallOutcomePage.radioLabelContains('Remanded in custody').click()
    overallOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
    cy.createOffence('A1234AB', '0', '0', '0')
    const offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(
      OffenceCheckOffenceAnswersPage,
      'You have added 1 offence',
    )
    offenceCheckOffenceAnswersPage.addMultipleCountsLink('0').click()
    isOffenceDateSamePage = Page.verifyOnPageTitle(IsOffenceDateSamePage, '15/07/2023')
  })

  it('submitting no answer results in error', () => {
    isOffenceDateSamePage.continueButton().click()
    isOffenceDateSamePage = Page.verifyOnPageTitle(IsOffenceDateSamePage, '15/07/2023')
    isOffenceDateSamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select whether the offence date is 15/07/2023')
  })
})
