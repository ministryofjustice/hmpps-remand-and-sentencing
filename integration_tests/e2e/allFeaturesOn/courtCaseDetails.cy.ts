import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import Page from '../../pages/page'
// TODO: once appeals is switched on merge the context into integration_tests/e2e/courtCase/courtCaseDetails.cy.ts
context('Appeals Court Case details Page', () => {
  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtCaseAppealLatest')
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit('/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/details')
    courtCaseDetailsPage = Page.verifyOnPageTitle(
      CourtCaseDetailsPage,
      'Hearings for C894623 at Accrington Youth Court',
    )
  })

  it('hearing tab shows correct data', () => {
    courtCaseDetailsPage
      .hearingsSection()
      .getHearingCardDetails()
      .should('deep.equal', [
        {
          'Case reference': 'C894623',
          Location: 'Accrington Youth Court',
          'Date of the appeal hearing': '15/12/2023',
          Outcome: 'Sentence varied',
          'Court documents': 'No documents uploaded',
          'Criminal Appeal Office case reference': 'G35461',
          Offences: {
            'offences (2)': [
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': '15/12/2025',
                Outcome: 'Sentence varied',
              },
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': 'Not entered',
                Outcome: 'Sentence quashed',
              },
            ],
          },
        },
      ])
  })

  it('should show delete button', () => {
    courtCaseDetailsPage
      .hearingActionList('94608b2e-c532-4cea-bae7-57bfff4566cb')
      .children()
      .should('have.length', 2)
      .and('contain.text', 'Delete')
  })
})
