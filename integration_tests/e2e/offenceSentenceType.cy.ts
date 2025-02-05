import OffenceConvictionDatePage from '../pages/offenceConvictionDatePage'
import OffenceSentenceTypePage from '../pages/offenceSentenceTypePage'
import Page from '../pages/page'

context('Add Offence Sentence Type Page', () => {
  let offenceSentenceTypePage: OffenceSentenceTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchSentenceTypes')
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetSentenceTypeById', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/conviction-date')
    const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
    offenceConvictionDatePage.dayDateInput('convictionDate').clear()
    offenceConvictionDatePage.dayDateInput('convictionDate').type('12')
    offenceConvictionDatePage.monthDateInput('convictionDate').clear()
    offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
    offenceConvictionDatePage.yearDateInput('convictionDate').clear()
    offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
    offenceConvictionDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/sentence-type')
    offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
  })

  it('displays person details', () => {
    offenceSentenceTypePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceSentenceTypePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting an option results in error', () => {
    offenceSentenceTypePage.continueButton().click()
    offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
    offenceSentenceTypePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the sentence type')
  })
})
