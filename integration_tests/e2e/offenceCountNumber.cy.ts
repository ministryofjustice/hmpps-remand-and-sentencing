import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import Page from '../pages/page'

context('Add Offence Count number Page', () => {
  let offenceCountNumberPage: OffenceCountNumberPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/count-number')
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('displays person details', () => {
    offenceCountNumberPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceCountNumberPage.continueButton().should('contain.text', 'Save and continue')
  })

  it('submitting without selecting entering anything results in error', () => {
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a count number.')
  })

  it('submitting 0 results in error', () => {
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('0')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a number greater than zero.')
  })

  it('submitting a decimal results in error', () => {
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('6.5')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Enter a whole number for the count number.')
  })

  it('submitting the same count number of another charge results in error', () => {
    cy.task('stubGetSentenceTypeById', {})
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-13' })
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/1/count-number')
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a unique count number')
  })

  it('submitting the same count number of another charge in the same court case results in error', () => {
    cy.task('stubGetCountNumbersForCourtCase', {
      countNumbers: ['1'],
    })
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/offences/0/count-number',
    )
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage.radioLabelSelector('true').click()
    offenceCountNumberPage.input().clear()
    offenceCountNumberPage.input().type('1')
    offenceCountNumberPage.continueButton().click()
    offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
    offenceCountNumberPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a unique count number')
  })
})
