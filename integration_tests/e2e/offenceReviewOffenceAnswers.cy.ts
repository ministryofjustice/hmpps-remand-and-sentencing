import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceReviewOffencesPage from '../pages/offenceReviewOffencesPage'
import OffenceUpdateOutcomePage from '../pages/offenceUpdateOutcomePage'
import Page from '../pages/page'
import StartPage from '../pages/startPage'

context('Review Offences Page', () => {
  let offenceReviewOffencesPage: OffenceReviewOffencesPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetCourtsByIds')
    cy.signIn()
  })

  context('repeat remand', () => {
    beforeEach(() => {
      cy.task('stubGetLatestCourtAppearance')
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.visit('/person/A1234AB')
      const startPage = Page.verifyOnPage(StartPage)
      startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()

      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/review-offences',
      )
      offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    })

    it('displays person details', () => {
      offenceReviewOffencesPage
        .prisonerBanner()
        .should('contain.text', 'Haggler, Marvin')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to continue is displayed', () => {
      offenceReviewOffencesPage.continueButton().should('contain.text', 'Continue')
    })

    it('update outcome and return to review offences page with one entry in non custodial', () => {
      cy.task('stubGetAllChargeOutcomes')
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          outcomeName: 'Lie on file',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
      })
      offenceReviewOffencesPage.updateOutcomeLink('A1234AB', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '2', '0').click()

      const offenceUpdateOutcomePage = Page.verifyOnPage(OffenceUpdateOutcomePage)
      offenceUpdateOutcomePage.radioLabelContains('Lie on file').click()
      offenceUpdateOutcomePage.continueButton().click()
      offenceReviewOffencesPage = Page.verifyOnPage(OffenceReviewOffencesPage)
    })
  })
})
