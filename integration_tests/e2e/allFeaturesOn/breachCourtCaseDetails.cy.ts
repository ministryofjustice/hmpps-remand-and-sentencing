import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import Page from '../../pages/page'
// TODO: once breach is switched on merge the context into integration_tests/e2e/courtCase/courtCaseDetails.cy.ts
context('Breach Court Case details Page', () => {
  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtCaseBreachLatest')
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
          'Breach hearing date': '15/12/2023',
          Outcome: 'DTO (Detention and Training Order)',
          'Breach of supervision requirements': '0 years 0 months 0 weeks 41 days',
          'Court documents': 'No documents uploaded',
          Offences: {
            'offences (2)': [
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': '15/12/2025',
                Outcome: 'DTO (Detention and Training Order)',
              },
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': 'Not entered',
                Outcome: 'DTO (Detention and Training Order)',
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
