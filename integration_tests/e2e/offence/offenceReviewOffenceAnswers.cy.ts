import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceReviewOffencesPage from '../../pages/offenceReviewOffencesPage'
import OffenceUpdateOutcomePage from '../../pages/offenceUpdateOutcomePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'

context('Review Offences Page', () => {
  let offenceReviewOffencesPage: OffenceReviewOffencesPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
  })

  context('repeat remand', () => {
    beforeEach(() => {
      cy.task('stubGetLatestCourtAppearance', {})
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetAllChargeOutcomes', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
        {
          outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          outcomeName: 'Lie on file',
          outcomeType: 'NON_CUSTODIAL',
        },
      ])
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.visit('/person/A1234AB')
      const startPage = Page.verifyOnPage(StartPage)
      startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6').click()

      const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
      receivedCustodialSentencePage.radioLabelSelector('false').click()
      receivedCustodialSentencePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/overall-case-outcome',
      )
      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Select the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
      courtCaseOverallCaseOutcomePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/review-offences',
      )
      offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    })

    it('shows error if Continue button pressed without selecting an outcome', () => {
      offenceReviewOffencesPage.continueButton().click()
      offenceReviewOffencesPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Select whether you have finished reviewing offences.')
    })

    it('update outcome and return to review offences page', () => {
      cy.task('stubGetOffenceByCode', {})
      offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()

      const offenceUpdateOutcomePage = Page.verifyOnPage(OffenceUpdateOutcomePage)
      offenceUpdateOutcomePage.radioLabelContains('Lie on file').click()
      offenceUpdateOutcomePage.continueButton().click()
      offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    })
  })
})
