import StartPage from '../pages/startPage'
import Page from '../pages/page'

context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
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
      'Case references': 'C894623, F23325',
      'Overall case outcome': 'Remanded in custody',
      'Next hearing': 'Birmingham Crown Court Court appearance 15/12/2024 10:30',
    })
  })

  it('displays inactive tag on inactive case', () => {
    startPage
      .courtCaseCard('d316d5b7-022f-40e5-98ab-aebe8ac4abf4')
      .getActions()
      .should('equal', 'Inactive Inactive (Court Case d316d5b7-022f-40e5-98ab-aebe8ac4abf4)')
  })

  it('displays add appearance link on inactive case', () => {
    startPage
      .courtCaseCard('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getActions()
      .should('equal', 'Add an appearance Add an appearance (Court Case 3fa85f64-5717-4562-b3fc-2c963f66afa6)')
  })

  it('displays court case appearances', () => {
    startPage
      .courtCaseAppearanceTable('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getTable()
      .should('deep.equal', [
        {
          'Case reference': 'C894623',
          Location: 'Accrington Youth Court',
          'Warrant date': '15/12/2023',
          Outcome: 'Remanded in custody',
          '': 'View and edit',
        },
        {
          'Case reference': 'F23325',
          Location: 'Accrington Youth Court',
          'Warrant date': '15/10/2022',
          Outcome: 'Lie on file',
          '': 'View and edit',
        },
      ])
  })

  it('displays offences', () => {
    startPage
      .courtCaseDetailsComponent('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '15/12/2023',
          Outcome: 'Not entered',
        },
      ])
  })

  it('can sort by earliest', () => {
    cy.task('stubSearchCourtCases', { sortBy: 'asc' })
    startPage.sortLink('asc').click()
    Page.verifyOnPage(StartPage)
  })
})
