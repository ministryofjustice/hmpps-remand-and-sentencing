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
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  it('displays person details', () => {
    startPage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
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
      'Overall case outcome': 'Remanded in custody',
      'Next hearing': 'Birmingham Crown Court Court appearance 15/12/2024 10:30',
    })
  })

  it('displays inactive tag on inactive case', () => {
    startPage.courtCaseCard('d316d5b7-022f-40e5-98ab-aebe8ac4abf4').getActions().should('equal', 'Inactive Inactive ()')
  })

  it('displays add appearance link on inactive case', () => {
    startPage
      .courtCaseCard('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getActions()
      .should('equal', 'Add an appearance Add an appearance (C894623 at Accrington Youth Court)')
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
    cy.task('stubSearchCourtCases', { sortBy: 'asc' })
    startPage.sortLink('asc').click()
    Page.verifyOnPage(StartPage)
  })
})
