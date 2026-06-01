import CourtCaseHearingDetailsPage from '../../pages/courtCaseHearingDetailsPage'
import Page from '../../pages/page'

context('Appeal appearance details Page', () => {
  let courtCaseHearingDetailsPage: CourtCaseHearingDetailsPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAppealAppearanceDetails')
    cy.task('stubGetAllChargeOutcomes', [
      {
        outcomeUuid: '42a30fcd-51c0-4c18-95f9-e3a364eb9176',
        outcomeName: 'Sentence varied',
        outcomeType: 'APPEAL',
      },
      {
        outcomeUuid: 'd50a4db1-47f8-4fbd-9f7f-be7a4f0eb267',
        outcomeName: 'Sentence quashed',
        outcomeType: 'APPEAL',
      },
    ])
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/fa078b3d-7c29-4f61-8120-b40b16ed9633/edit-court-appearance/94608b2e-c532-4cea-bae7-57bfff4566cb/appeals/hearing-details',
    )
    courtCaseHearingDetailsPage = Page.verifyOnPageTitle(CourtCaseHearingDetailsPage, 'Edit hearing')
  })

  it('hearing summary shows correct data', () => {
    courtCaseHearingDetailsPage.hearingSummaryList().getSummaryList().should('deep.equal', {
      'Case reference': 'C894623',
      'Criminal Appeal Office reference': 'G35461',
      'Hearing date': '15/12/2023',
      Location: 'Accrington Youth Court',
      'Overall case outcome': 'Sentence varied',
    })
  })

  it('displays offences correctly', () => {
    courtCaseHearingDetailsPage
      .appealedOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': 'Not entered',
          Outcome: 'Sentence quashed',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '15/12/2025',
          Outcome: 'Sentence varied',
        },
      ])
    courtCaseHearingDetailsPage
      .withoutAppealRecordedInset()
      .trimTextContent()
      .should('equal', 'There are no offences without an appeal recorded.')
  })
})
