import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceIsOffenceAggravatedPage from '../../pages/offenceIsOffenceAggravatedPage'

context('Add Offence Offence Code Page', () => {
  let offenceOffenceCodePage: OffenceOffenceCodePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
    offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
  })

  it('checking the checkbox after typing the input clears the input', () => {
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.checkboxLabelSelector('true').click()
    offenceOffenceCodePage.input().should('be.empty')
  })

  it('typing in the input after checking the checkbox clears the checkbox', () => {
    offenceOffenceCodePage.checkboxLabelSelector('true').click()
    offenceOffenceCodePage.input().type('PS90037')
    offenceOffenceCodePage.unknownCodeCheckbox().should('not.be.checked')
  })
  it('submitting a code which does not exist results in error', () => {
    cy.task('stubGetOffenceByCodeNotFound')
    offenceOffenceCodePage.input().type('AB12345')
    offenceOffenceCodePage.continueButton().click()
    offenceOffenceCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid offence code.')
  })
  it('submitting without entering a code or ticking the box results in error', () => {
    offenceOffenceCodePage.continueButton().click()
    offenceOffenceCodePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the offence code')
  })
  it('caption should show for adding an offence', () => {
    offenceOffenceCodePage
      .captionText()
      .invoke('text')
      .then(text => text.trim())
      .should('equal', 'Add offences')
  })

  context('Entering an offence via the Offence code route', () => {
    beforeEach(() => {
      // Start
      cy.visit(`/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence`)
      const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
      receivedCustodialSentencePage.radioLabelSelector('false').click()
      receivedCustodialSentencePage.continueButton().click()

      // Warrant Date
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('20')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
      courtCaseWarrantDatePage.continueButton().click()

      // Offence Date
      cy.visit(`/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-date`)
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('16')
      offenceOffenceDatePage.monthDateInput('offenceStartDate').clear().type('8')
      offenceOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
      offenceOffenceDatePage.continueButton().click()
    })

    it('navigates to the offence-confirmation page when not schedule part 11', () => {
      offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('PS90037')
      offenceOffenceCodePage.continueButton().click()

      Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    })

    it('navigates to the aggravated page when offence IS schedule part 11', () => {
      cy.task('stubGetTerrorOffenceByCode', { offenceCode: 'OF61003' })

      offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('OF61003')
      offenceOffenceCodePage.continueButton().click()

      Page.verifyOnPage(OffenceIsOffenceAggravatedPage)
    })
  })
})
