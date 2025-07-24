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
        .should('contain.text', 'Meza, Cormac')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('appearances tab shows correct data', () => {
      courtCaseDetailsPage
        .appearancesTab()
        .getAppearanceCardDetails()
        .should('deep.equal', [
          {
            'Case reference': 'C894623',
            Location: 'Accrington Youth Court',
            'Warrant date': '15/12/2023',
            Outcome: 'Remanded in custody',
            'Next hearing': '15/12/2024 at Accrington Youth Court',
            'Court documents': 'No documents uploaded',
            Offences: {
              'Offences (2)': [
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': 'Not entered',
                  Outcome: 'Commit to Crown Court for trial in custody',
                },
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '15/12/2023',
                  Outcome: 'Remanded in custody',
                },
              ],
            },
          },
          {
            'Case reference': 'F23325',
            Location: 'Birmingham Crown Court',
            'Warrant date': '15/10/2022',
            Outcome: 'Lie on file',
            'Next hearing': '15/12/2023 at Birmingham Crown Court',
            'Court documents': 'No documents uploaded',
            Offences: {
              'Offences (1)': [
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '15/12/2023',
                  Outcome: 'A Nomis Outcome',
                },
              ],
            },
          },
        ])
    })
    it('should show delete button', () => {
      courtCaseDetailsPage
        .appearanceActionList('a6400fd8-aef4-4567-b18c-d1f452651933')
        .children()
        .should('have.length', 2)
        .and('contain.text', 'Delete')
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

    it('appearances tab shows correct data', () => {
      courtCaseDetailsPage
        .appearancesTab()
        .getAppearanceCardDetails()
        .should('deep.equal', [
          {
            'Case reference': 'C894623',
            'Warrant date': '15/12/2023',
            Location: 'Accrington Youth Court',
            Outcome: 'Imprisonment',
            'Court documents': 'No documents uploaded',
            Offences: {
              'Offences (4)': [
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '15/02/2024',
                  Outcome: 'Imprisonment',
                  'Sentence type': 'SDS (Standard Determinate Sentence)',
                  'Sentence length': '4 years 5 months 0 weeks 0 days',
                  'Consecutive or concurrent': 'Consecutive to count 1',
                },
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '16/12/2023',
                  Outcome: 'Imprisonment',
                  'Sentence type': 'A Nomis sentence type',
                  'Sentence length': '1 years 2 months 0 weeks 0 days',
                  'Consecutive or concurrent': 'Unknown',
                },
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '15/12/2023',
                  Outcome: 'Imprisonment',
                  'Sentence type': 'SDS (Standard Determinate Sentence)',
                  'Sentence length': '4 years 5 months 0 weeks 0 days',
                  'Consecutive or concurrent': 'Forthwith',
                },
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '03/06/2023',
                  Outcome: 'Imprisonment',
                  'Sentence type': 'SDS (Standard Determinate Sentence)',
                  'Sentence length': '4 years 5 months 0 weeks 0 days',
                  'Consecutive or concurrent':
                    'Consecutive to count 1 on case X34345 at Southampton Magistrate Court on 23/02/2023',
                },
              ],
            },
          },
          {
            'Case reference': 'F23325',
            'Warrant date': '15/10/2022',
            Location: 'Birmingham Crown Court',
            Outcome: 'A Nomis Outcome',
            'Court documents': 'No documents uploaded',
            Offences: {
              'Offences (1)': [
                {
                  offenceCardHeader: 'PS90037 An offence description',
                  'Committed on': '15/12/2023',
                  Outcome: 'Remanded in custody',
                },
              ],
            },
          },
        ])
    })

    it('Drafts tab should not display', () => {
      courtCaseDetailsPage.draftsTab().should('not.exist')
    })

    it('do not show edit or delete when appearance contains a recall', () => {
      courtCaseDetailsPage
        .appearanceActionList('a6400fd8-aef4-4567-b18c-d1f452651933')
        .children()
        .should('have.length', 0)
    })

    it('show edit or delete when appearance has no recalls', () => {
      courtCaseDetailsPage
        .appearanceActionList('5b4cbea0-edd3-4bac-9485-b3e3cd46ad77')
        .children()
        .should('have.length', 2)
    })
  })
})
