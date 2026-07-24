import HearingUpdatedConfirmationPage from '../../pages/HearingUpdatedConfirmationPage'
import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import Page from '../../pages/page'
import CourtCaseReferencePage from '../../pages/courtCaseReferencePage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'

context('Breach appearance details Page', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes', [
      {
        outcomeUuid: 'e022f78a-016a-4e11-905b-66a1fee27584',
        outcomeName: 'DTO',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
  })
  beforeEach(() => {
    cy.task('stubGetBreachAppearanceDetails')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/94608b2e-c532-4cea-bae7-57bfff4566cb/breach/hearing-details',
    )
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })

  it('hearing summary shows correct data', () => {
    courtCaseHearingDetailsPage.hearingSummaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Hearing date': '15/12/2023',
      'Court name': 'Accrington Youth Court',
      'Breach of supervision requirements': '0 years 0 months 0 weeks 41 days',
    })
  })

  it('displays offences correctly', () => {
    courtCaseHearingDetailsPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': 'Not entered',
          Outcome: 'DTO',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '15/12/2025',
          Outcome: 'DTO',
        },
      ])
    courtCaseHearingDetailsPage
      .noNonCustodialOutcomeInset()
      .trimTextContent()
      .should('equal', 'There are no offences with non-custodial outcomes.')
  })

  it('can delete an offence from hearing', () => {
    courtCaseHearingDetailsPage
      .deleteOffenceLink(
        'A1234AB',
        'fa078b3d-7c29-4f61-8120-b40b16ed9633',
        '94608b2e-c532-4cea-bae7-57bfff4566cb',
        'breach',
        '9b622879-8191-4a7f-9fe8-71b680417220',
      )
      .click()
    const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
    offenceDeleteOffencePage.deleteButton().click()
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    courtCaseHearingDetailsPage
      .custodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '15/12/2025',
          Outcome: 'DTO',
        },
      ])
  })

  it('can submit changes to API', () => {
    cy.task('stubCreateCourtAppearance')
    cy.task('stubGetLatestCourtAppearanceWithAppeal', {})
    cy.task('stubGetCourtById', {})
    courtCaseHearingDetailsPage
      .editFieldLink(
        'A1234AB',
        'fa078b3d-7c29-4f61-8120-b40b16ed9633',
        '94608b2e-c532-4cea-bae7-57bfff4566cb',
        'reference',
      )
      .click()
    const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Edit case reference')
    courtCaseReferencePage.noCaseReferenceCheckbox().should('not.be.checked')
    courtCaseReferencePage.input().clear().type('T12345678')
    courtCaseReferencePage.continueButton().click()
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
    courtCaseHearingDetailsPage.confirmButton().click()
    Page.verifyOnPage(HearingUpdatedConfirmationPage)
    cy.task('verifyUpdateBreachCourtAppearanceRequest').should('equal', 1)
  })
})
