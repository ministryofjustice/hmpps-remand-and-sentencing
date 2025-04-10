import CourtCaseOverallSentenceLengthPage from '../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceUpdateOffenceOutcomesPage from '../pages/offenceUpdateOffenceOutcomesPage'
import Page from '../pages/page'
import StartPage from '../pages/startPage'

context('Review Offences Page', () => {
  let offenceUpdateOffenceOutcomesPage: OffenceUpdateOffenceOutcomesPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
  })

  context('Remand to Sentence', () => {
    beforeEach(() => {
      cy.task('stubGetLatestCourtAppearanceWithSentencing')
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: 'f17328cf-ceaa-43c2-930a-26cf74480e18',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.visit('/person/A1234AB')
      const startPage = Page.verifyOnPage(StartPage)
      startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()

      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/overall-sentence-length',
      )
      const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
      courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
      courtCaseOverallSentenceLengthPage.yearsInput().type('4')
      courtCaseOverallSentenceLengthPage.monthsInput().type('5')
      courtCaseOverallSentenceLengthPage.weeksInput().type('3')
      courtCaseOverallSentenceLengthPage.daysInput().type('2')
      courtCaseOverallSentenceLengthPage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/review-offences',
      )
      offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
    })

    it('should display the govukSummaryList with overall sentence length', () => {
      // Assert that the govukSummaryList is visible
      offenceUpdateOffenceOutcomesPage.sentenceLengthSection().should('be.visible')
    })
  })
})
