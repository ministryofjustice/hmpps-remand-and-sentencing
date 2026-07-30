import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceReviewOffencesPage from '../../pages/offenceReviewOffencesPage'
import OffenceBulkOffenceToBeUpdatedPage from '../../pages/offenceBulkOffenceToBeUpdatedPage'
import OffenceWhichOffencesOutcomeAppliesToPage from '../../pages/offenceWhichOffencesOutcomeAppliesToPage'
import OffenceNewOutcomeForTheseOffencesPage from '../../pages/offenceNewOutcomeForTheseOffencesPage'
import OffenceUpdateOutcomePage from '../../pages/offenceUpdateOutcomePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'

context('Review Offences Page bulk outcome update', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetLatestCourtAppearanceWithMultipleOffences', {})
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
    cy.signIn()
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
  })

  it('shows the bulk offence to be updated placeholder page when more than one offence needs an outcome and none have been updated yet', () => {
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
    Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
  })

  it('shows a validation error and highlights the radios when no selection is made', () => {
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
    const offenceBulkOffenceToBeUpdatedPage = Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
    offenceBulkOffenceToBeUpdatedPage.continueButton().click()

    Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
    offenceBulkOffenceToBeUpdatedPage
      .errorSummary()
      .should('contain', 'There is a problem')
      .and('contain', 'Select whether or not the outcome applies to more than one offence')
    cy.get('.govuk-form-group--error').should('exist')
  })

  it('navigates to the which offences page when yes is selected', () => {
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
    const offenceBulkOffenceToBeUpdatedPage = Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
    offenceBulkOffenceToBeUpdatedPage.radioLabelSelector('true').click()
    offenceBulkOffenceToBeUpdatedPage.continueButton().click()

    Page.verifyOnPage(OffenceWhichOffencesOutcomeAppliesToPage)
  })

  it('navigates to the update offence outcome page when no is selected', () => {
    const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
    const offenceBulkOffenceToBeUpdatedPage = Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
    offenceBulkOffenceToBeUpdatedPage.radioLabelSelector('false').click()
    offenceBulkOffenceToBeUpdatedPage.continueButton().click()

    Page.verifyOnPage(OffenceUpdateOutcomePage)
  })

  context('Which offences does the new outcome apply to', () => {
    beforeEach(() => {
      const offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
      offenceReviewOffencesPage.updateOutcomeLink('71bb9f7e-971c-4c34-9a33-43478baee74f').click()
      const offenceBulkOffenceToBeUpdatedPage = Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
      offenceBulkOffenceToBeUpdatedPage.radioLabelSelector('true').click()
      offenceBulkOffenceToBeUpdatedPage.continueButton().click()
    })

    it('lists each offence without an outcome yet, with the selected offence checked and locked', () => {
      const whichOffencesPage = Page.verifyOnPage(OffenceWhichOffencesOutcomeAppliesToPage)

      whichOffencesPage.checkboxSelector('71bb9f7e-971c-4c34-9a33-43478baee74f').should('be.checked').and('be.disabled')
      whichOffencesPage
        .checkboxSelector('82cc9f7e-971c-4c34-9a33-43478baee750')
        .should('not.be.checked')
        .and('be.enabled')
    })

    it('navigates to the update offence outcome page when only one offence is selected', () => {
      const whichOffencesPage = Page.verifyOnPage(OffenceWhichOffencesOutcomeAppliesToPage)
      whichOffencesPage.continueButton().click()

      Page.verifyOnPage(OffenceUpdateOutcomePage)
    })

    it('navigates to the new outcome for these offences page when more than one offence is selected', () => {
      const whichOffencesPage = Page.verifyOnPage(OffenceWhichOffencesOutcomeAppliesToPage)
      whichOffencesPage.checkboxLabelSelector('82cc9f7e-971c-4c34-9a33-43478baee750').click()
      whichOffencesPage.continueButton().click()

      Page.verifyOnPage(OffenceNewOutcomeForTheseOffencesPage)
    })

    it('navigates back to the more than one offence page when back is clicked', () => {
      const whichOffencesPage = Page.verifyOnPage(OffenceWhichOffencesOutcomeAppliesToPage)
      whichOffencesPage.backLink().click()

      Page.verifyOnPage(OffenceBulkOffenceToBeUpdatedPage)
    })
  })
})
