import CourtCaseCheckAnswersPage from '../../pages/courtCaseCheckAnswersPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import Page from '../../pages/page'
import CourtCaseCancelCourtCasePage from '../../pages/courtCaseCancelCourtCase'
import CourtCaseCourtNamePage from '../../pages/courtCaseCourtNamePage'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'

context('Court Case Cancel Court Case Page', () => {
  let receivedCustodialSentencePage: ReceivedCustodialSentencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
  })

  it('should not show court name and hearing date until it is provided', () => {
    receivedCustodialSentencePage.cancelButton().click()
    const courtCaseCancelCourtCasePage = Page.verifyOnPageTitle(
      CourtCaseCancelCourtCasePage,
      'Are you sure you want to cancel adding a court case?',
    )
    courtCaseCancelCourtCasePage
      .description()
      .should('contain', 'You have not finished adding the information. Any information you have entered will be lost.')
  })

  it('should show court name and hearing date once it is provided', () => {
    receivedCustodialSentencePage.radioLabelSelector('false').click()
    receivedCustodialSentencePage.continueButton().click()
    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/reference')

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
    courtCaseReferencePage.input().type('T12345678')
    courtCaseReferencePage.continueButton().click()
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    courtCaseCourtNamePage.autoCompleteInput().type('cou')
    courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
    courtCaseCourtNamePage.firstAutoCompleteOption().click()
    courtCaseCourtNamePage.continueButton().click()

    const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
    courtCaseCheckAnswersPage.cancelButton().click()
    const courtCaseCancelCourtCasePage = Page.verifyOnPageTitle(
      CourtCaseCancelCourtCasePage,
      'Are you sure you want to cancel adding a court case?',
    )
    courtCaseCancelCourtCasePage
      .description()
      .should(
        'contain',
        'You have not finished adding the information for the court case at Accrington Youth Court on 12/05/2023. Any information you have entered will be lost.',
      )
  })

  it('should show correct header for edit journey', () => {
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    cy.task('stubGetRemandAppearanceDetails')
    cy.task('stubGetAppearanceTypeByUuid')
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.visit(
      '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/non-sentencing/hearing-details',
    )
    const courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    courtCaseHearingDetailsPage
      .editFieldLink(
        'A1234AB',
        '83517113-5c14-4628-9133-1e3cb12e31fa',
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        'reference',
      )
      .click()

    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Edit case reference')
    courtCaseReferencePage.cancelButton().click()
    Page.verifyOnPageTitle(CourtCaseCancelCourtCasePage, 'Are you sure you want to cancel editing a court case?')
  })
})
