import StartPage from '../pages/startPage'
import Page from '../pages/page'

context('Start Page', () => {
  let startPage: StartPage
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubManageUser')
    cy.task('stubGetPersonDetails')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes')
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  it('displays person details', () => {
    startPage
      .prisonerBanner()
      .should('contain.text', 'Marvin Haggler')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'Date of birth03 02 1965')
      .and('contain.text', 'PNC number1231/XX/121')
      .and('contain.text', 'StatusREMAND')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('action list link to add a court case is displayed', () => {
    startPage
      .actionListLink()
      .should('contain', 'Add a new court case')
      .and('have.attr', 'href', '/person/A1234AB/add-court-case/1/appearance/0/reference')
  })

  it('displays court case summary', () => {
    startPage.courtCaseSummaryList('3fa85f64-5717-4562-b3fc-2c963f66afa6').getSummaryList().should('deep.equal', {
      'Case references': 'C894623, F23325',
      'Overall case outcome': 'Remand in Custody (Bail Refused)',
      'Next hearing': 'Birmingham Crown Court Court appearance 15 12 2024',
    })
  })

  it('displays court case appearances', () => {
    startPage
      .courtCaseAppearanceTable('3fa85f64-5717-4562-b3fc-2c963f66afa6')
      .getTable()
      .should('deep.equal', [
        {
          'Case reference': 'C894623',
          Location: 'Birmingham Crown Court',
          'Warrant date': '15 12 2023',
          Outcome: 'Remand in Custody (Bail Refused)',
          '': 'View and edit',
        },
        {
          'Case reference': 'F23325',
          Location: 'Birmingham Crown Court',
          'Warrant date': '15 10 2022',
          Outcome: 'Sentence Postponed',
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
          'Committed on': '15 12 2023',
          Outcome: 'Remand in Custody (Bail Refused)',
        },
      ])
  })

  it('can sort by earliest', () => {
    cy.task('stubSearchCourtCases', { sortBy: 'asc' })
    startPage.sortLink('asc').click()
    Page.verifyOnPage(StartPage)
  })
})
