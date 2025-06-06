import StartPage from '../pages/startPage'
import Page from '../pages/page'

context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetConsecutiveToDetails')
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  it('displays person details', () => {
    startPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'Date of birth03/02/1965')
      .and('contain.text', 'StatusSentenced with a sentence c')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('action list link to add a court case is displayed', () => {
    startPage
      .actionListLink()
      .should('contain', 'Add a new court case')
      .and('have.attr', 'href', '/person/A1234AB/add-court-case/1/add-court-appearance/0/new-journey')
  })

  it('displays court case summary', () => {
    startPage.courtCaseSummaryList('3fa85f64-5717-4562-b3fc-2c963f66afa6').getSummaryList().should('deep.equal', {
      'Case references': 'C894623, F23325, J39596',
      'First day in custody': '15/10/2022 (Remand)',
      'Overall case outcome': 'Remanded in custody',
      'Next hearing': 'Birmingham Crown Court Court appearance 15/12/2024 10:30',
    })
  })

  it('displays inactive tag on inactive case', () => {
    startPage
      .courtCaseCard('84ab3dc4-7bd7-4b14-a1ae-6434f7e2cc8b')
      .getActions()
      .should('equal', 'Inactive Inactive (C894623 at Accrington Youth Court)')
  })

  it('does not show merged from inset on case with no merged from cases', () => {
    startPage.mergedCaseInset('261911e2-6346-42e0-b025-a806048f4d04').should('not.exist')
  })

  it('displays latest appearance', () => {
    startPage
      .courtCaseLatestAppearanceCaseReference('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .should('contain.text', 'C894623')
    startPage
      .courtCaseLatestAppearanceWarrantDate('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .should('contain.text', '15/12/2023')
    startPage
      .courtCaseLatestAppearanceLocation('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .should('contain.text', 'Accrington Youth Court')
    startPage
      .courtCaseLatestAppearanceOutcome('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .should('contain.text', 'Remanded in custody')
  })

  it('displays offences', () => {
    startPage
      .courtCaseDetailsComponent('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getOffenceCards()
      .should('deep.equal', [
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
      ])
  })

  it('can sort by earliest', () => {
    cy.task('stubSearchCourtCases', { sortBy: 'APPEARANCE_DATE_ASC' })
    startPage.sortLink('APPEARANCE_DATE_ASC').click()
    Page.verifyOnPage(StartPage)
  })

  it('displays sentence court case summary', () => {
    startPage.courtCaseSummaryList('261911e2-6346-42e0-b025-a806048f4d04').getSummaryList().should('deep.equal', {
      'Case references': 'XX1234, YY1234',
      'First day in custody': '23/01/2024 (Sentencing)',
      'Overall case outcome': 'Imprisonment',
      'Overall sentence length': '1 years 0 months 0 weeks 0 days',
      'Conviction date': '23/10/2023',
      'Next hearing': 'No future appearance scheduled',
    })
  })

  it('displays sentenced offences correctly', () => {
    startPage
      .courtCaseDetailsComponent('261911e2-6346-42e0-b025-a806048f4d04')
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '11/05/2024',
          Outcome: 'Imprisonment',
          'Conviction date': '11/05/2024',
          'Sentence type': 'A NOMIS Fine Sentence Type',
          'Fine amount': '£10',
          'Consecutive or concurrent': 'Concurrent',
          'Term length': '0 years 6 months 0 weeks 0 days',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '07/01/2024',
          Outcome: 'Imprisonment',
          'Conviction date': '11/05/2024',
          'Sentence type': 'A NOMIS Fine Sentence Type',
          'Fine amount': '£10',
          'Consecutive or concurrent': 'Consecutive to count 1',
          'Term length': '0 years 3 months 0 weeks 0 days',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '11/10/2023',
          Outcome: 'Imprisonment',
          'Consecutive or concurrent': 'Forthwith',
          'Conviction date': '12/10/2023',
          'Sentence type': 'A NOMIS Sentence Type',
          'Tariff length': '1 years 0 months 0 weeks 0 days',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '11/05/2023',
          Outcome: 'Imprisonment',
          'Consecutive or concurrent':
            'Consecutive to count 1 on case X34345 at Southampton Magistrate Court on 23/02/2023',
          'Conviction date': '11/05/2024',
          'Sentence type': 'A NOMIS Fine Sentence Type',
          'Fine amount': '£10',
          'Term length': '0 years 2 months 0 weeks 0 days',
        },
      ])
  })

  it('displays recalled tag when there is a recalled sentence', () => {
    startPage
      .courtCaseCard('e3ef1929-98b7-4034-bfdf-5c597f51fca7')
      .getActions()
      .should('equal', 'Recalled Recalled (XX1234 at Accrington Youth Court)')

    startPage
      .recallInset('e3ef1929-98b7-4034-bfdf-5c597f51fca7')
      .should(
        'contain.text',
        'The court case was part of a recall. To make any changes to the recall, update the details in NOMIS then reload this page.',
      )
  })

  it('do not display recall inset when user has access to recalls', () => {
    cy.visit('/sign-out')
    cy.task('stubSignIn', {
      roles: ['ROLE_REMAND_AND_SENTENCING', 'ROLE_RELEASE_DATES_CALCULATOR', 'ROLE_RECALL_MAINTAINER'],
    })
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage.recallInset('e3ef1929-98b7-4034-bfdf-5c597f51fca7').should('not.exist')
  })

  it('displays empty content when no court cases', () => {
    cy.task('stubEmptySearchCourtCases', {})
    cy.reload()
    startPage.courtCasesContent().should('contain.text', 'There are no court cases recorded for Cormac Meza')
  })

  it('displays merged from cases correctly', () => {
    startPage
      .mergedCaseInset('c0f90a3c-f1c5-4e2e-9360-2a9d7bd33dda')
      .should('contain.text', 'NOMIS123 was merged with this case on 05/06/2019')
    startPage
      .courtCaseDetailsComponent('c0f90a3c-f1c5-4e2e-9360-2a9d7bd33dda')
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '05/06/2025',
          Outcome: 'Outcome Description',
          'Merged from': 'NOMIS123 at Accrington Youth Court',
        },
      ])
  })
})
