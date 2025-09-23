import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import OffenceUpdateOffenceOutcomesPage from '../../pages/offenceUpdateOffenceOutcomesPage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Update Offence Outcomes Page', () => {
  let offenceUpdateOffenceOutcomesPage: OffenceUpdateOffenceOutcomesPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
  })

  context('Remand to Sentence', () => {
    beforeEach(() => {
      cy.task('stubGetLatestCourtAppearance', {})
      cy.task('stubGetOffencesByCodes', {})
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

      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/sentencing/overall-sentence-length',
      )
      const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
      courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
      courtCaseOverallSentenceLengthPage.yearsInput().type('4')
      courtCaseOverallSentenceLengthPage.monthsInput().type('5')
      courtCaseOverallSentenceLengthPage.weeksInput().type('3')
      courtCaseOverallSentenceLengthPage.daysInput().type('2')
      courtCaseOverallSentenceLengthPage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/update-offence-outcomes',
      )
      offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
    })

    it('shows error if Continue button pressed without selecting an outcome', () => {
      offenceUpdateOffenceOutcomesPage.continueButton().click()
      offenceUpdateOffenceOutcomesPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Select whether you have finished reviewing offences.')
    })

    it('do not show outcome in offences which need updating list', () => {
      offenceUpdateOffenceOutcomesPage
        .offencesNeedUpdating()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '12/05/2023',
          },
        ])
    })

    it('shows error when there are offences which need outcome updating', () => {
      offenceUpdateOffenceOutcomesPage.radioLabelSelector('true').click()
      offenceUpdateOffenceOutcomesPage.continueButton().click()
      offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
      offenceUpdateOffenceOutcomesPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Update the offence outcome')
    })
  })
})
