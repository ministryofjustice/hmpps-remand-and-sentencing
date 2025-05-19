import dayjs from 'dayjs'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import Page from '../pages/page'
import OffenceOffenceInactivePage from '../pages/offenceOffenceInactivePage'

context('Add Offence Offence Inactive Page', () => {
  let offenceOffenceInactivePage: OffenceOffenceInactivePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {
      offenceCode: 'CC12345',
      offenceDescription: 'An inactive offence description',
      endDate: dayjs().subtract(2, 'days').format('YYYY-MM-DD'),
    })
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('CC12345')
    offenceOffenceCodePage.continueButton().click()
    offenceOffenceInactivePage = Page.verifyOnPage(OffenceOffenceInactivePage)
  })

  it('displays person details', () => {
    offenceOffenceInactivePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    offenceOffenceInactivePage.continueButton().should('contain.text', 'Yes, continue')
  })
})
