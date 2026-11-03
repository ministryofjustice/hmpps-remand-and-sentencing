import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import Page from '../../pages/page'

import OffenceValuePage from '../../pages/offenceValuePage'

context('Add Offence Value Page', () => {
  let offenceValuePage: OffenceValuePage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-value')

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)
  })

  it('submitting without selecting yes or no results in error', () => {
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage.errorSummary().trimTextContent().should('equal', 'There is a problem You must enter a value.')
  })

  it('selecting yes without entering a value results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()

    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage.errorSummary().trimTextContent().should('equal', 'There is a problem You must enter a value.')
  })

  it('selecting no allows progress', () => {
    offenceValuePage.radioLabelSelector('false').click()

    offenceValuePage.continueButton().click()

    Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('selecting yes and entering a value allows progress', () => {
    offenceValuePage.radioLabelSelector('true').click()

    offenceValuePage.input().clear()
    offenceValuePage.input().type('1000')

    offenceValuePage.continueButton().click()

    Page.verifyOnPage(OffenceCountNumberPage)
  })

  it('submitting a negative value results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()
    offenceValuePage.input().clear()
    offenceValuePage.input().type('-100')
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The value must be entered in a valid format, such as £21.34')
  })

  it('submitting non-numeric characters results in error', () => {
    offenceValuePage.radioLabelSelector('true').click()
    offenceValuePage.input().clear()
    offenceValuePage.input().type('abc')
    offenceValuePage.continueButton().click()

    offenceValuePage = Page.verifyOnPage(OffenceValuePage)

    offenceValuePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem The value must be entered in a valid format, such as £21.34')
  })
})
