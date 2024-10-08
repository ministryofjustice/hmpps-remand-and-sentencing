import CourtCaseDetailsPage from '../pages/courtCaseDetailsPage'
import Page from '../pages/page'

context('Court Case details Page', () => {
  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
  })

  context('Latest remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseRemandLatest')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )
    })

    it('displays person details', () => {
      courtCaseDetailsPage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('appearances summary shows correct data', () => {
      courtCaseDetailsPage.appearancesSummaryList().getSummaryList().should('deep.equal', {
        'Case references': 'C894623, F23325',
        'Overall case outcome': 'Remanded in custody',
        'Next hearing date': '15 12 2024',
      })
    })

    it('appearances table shows correct data', () => {
      courtCaseDetailsPage
        .appearancesTable()
        .getTableAndOffences()
        .should('deep.equal', [
          {
            'Case reference': 'C894623',
            Location: 'Accrington Youth Court',
            'Warrant date': '15 12 2023',
            Outcome: 'Remanded in custody',
            '': 'Edit',
          },
          {
            'Offences (1)': [
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': '15 12 2023',
                Outcome: 'Remanded in custody',
              },
            ],
          },
          {
            'Case reference': 'F23325',
            Location: 'Birmingham Crown Court',
            'Warrant date': '15 10 2022',
            Outcome: 'Lie on file',
            '': 'Edit',
          },
          {
            'Offences (1)': [
              {
                offenceCardHeader: 'PS90037 An offence description',
                'Committed on': '15 12 2023',
                Outcome: 'A Nomis Outcome',
              },
            ],
          },
        ])
    })
  })

  context('Latest sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseSentenceLatest')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )
    })

    it('appearances summary shows correct data', () => {
      courtCaseDetailsPage.appearancesSummaryList().getSummaryList().should('deep.equal', {
        'Case references': 'C894623, F23325',
        'Overall case outcome': 'Imprisonment',
        'Overall sentence length': '4 years 5 months 0 weeks 0 days',
      })
    })
  })
})
