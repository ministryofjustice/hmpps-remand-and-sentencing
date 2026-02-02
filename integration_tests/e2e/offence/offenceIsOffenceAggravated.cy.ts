import Page from '../../pages/page'
import OffenceIsOffenceAggravatedPage from '../../pages/offenceIsOffenceAggravatedPage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceInactivePage from '../../pages/offenceOffenceInactivePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'

context('Is offence Aggravated by Terrorist Connection Page', () => {
  let offenceIsOffenceAggravatedPage: OffenceIsOffenceAggravatedPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.continueButton().click()
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

  it('submitting and going back on the page should prepopulate the radio button', () => {
    offenceIsOffenceAggravatedPage.radioLabelSelector('true').click()
    offenceIsOffenceAggravatedPage.continueButton().click()
    Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/is-offence-aggravated')
    offenceIsOffenceAggravatedPage.radioSelector('true').should('be.checked')
  })

  it('show after inactive offence', () => {
    cy.task('stubGetTerrorOffenceByCode', {
      offenceCode: 'VV12345',
      offenceDescription: 'Offence description',
      endDate: '2009-05-05',
    })

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date')
    const offenceOffenceDatePage = Page.verifyOnPageTitle(
      OffenceOffenceDatePage,
      'Enter the offence dates for the first offence',
    )
    offenceOffenceDatePage.dayDateInput('offenceStartDate').type('10')
    offenceOffenceDatePage.monthDateInput('offenceStartDate').type('5')
    offenceOffenceDatePage.yearDateInput('offenceStartDate').type('2023')
    offenceOffenceDatePage.continueButton().click()

    const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    offenceOffenceCodePage.input().clear().type('VV12345')
    offenceOffenceCodePage.continueButton().click()
    const offenceInactivePage = Page.verifyOnPage(OffenceOffenceInactivePage)
    offenceInactivePage.continueButton().click()
    Page.verifyOnPage(OffenceIsOffenceAggravatedPage)
  })
})
