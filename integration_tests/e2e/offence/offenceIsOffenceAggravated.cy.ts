import Page from '../../pages/page'
import OffenceIsOffenceAggravatedPage from '../../pages/offenceIsOffenceAggravatedPage'

context('Is offence Aggravated by Terrorist Connection Page', () => {
  let offenceIsOffenceAggravatedPage: OffenceIsOffenceAggravatedPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})

    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/is-offence-aggravated')
    offenceIsOffenceAggravatedPage = Page.verifyOnPage(OffenceIsOffenceAggravatedPage)
  })

  it('submitting without selecting an option results in error', () => {
    offenceIsOffenceAggravatedPage.continueButton().click()
    offenceIsOffenceAggravatedPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select Yes if the offence is aggravated by a terrorist connection')
  })
})
