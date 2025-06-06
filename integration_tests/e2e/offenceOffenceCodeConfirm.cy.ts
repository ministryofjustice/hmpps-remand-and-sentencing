import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'

context('Add Offence Offence Code Page', () => {
  let offenceOffenceCodeConfirmPage: OffenceOffenceCodeConfirmPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
    offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
  })

  it('displays person details', () => {
    offenceOffenceCodeConfirmPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceCodeConfirmPage.continueButton().should('contain.text', 'Confirm and continue')
  })

  it('displays offence details', () => {
    offenceOffenceCodeConfirmPage.offenceSummaryList().getSummaryList().should('deep.equal', {
      'Offence code': 'PS90037',
      Description: 'An offence description',
      'Home office code (CJA)': '099/96',
    })
  })
})
