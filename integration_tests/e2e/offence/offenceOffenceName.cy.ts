import OffenceOffenceNamePage from '../../pages/offenceOffenceNamePage'
import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import OffenceIsOffenceAggravatedPage from '../../pages/offenceIsOffenceAggravatedPage'

context('Add Offence Offence Name Page', () => {
  let offenceOffenceNamePage: OffenceOffenceNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubSearchOffenceByName')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.signIn()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-name')
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
  })

  it('submitting without entering anything in the inputs results in an error', () => {
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter the offence')
  })

  it('submitting an invalid offence results in an error', () => {
    offenceOffenceNamePage.autoCompleteInput().type('an invalid offence')
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
    offenceOffenceNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must enter a valid offence.')
  })

  it('Clearing the the selection removes all text from the auto complete field', () => {
    offenceOffenceNamePage.autoCompleteInput().type('invalid offence text')
    offenceOffenceNamePage.autoCompleteInput().should('have.value', 'invalid offence text')
    offenceOffenceNamePage.continueButton().click()
    offenceOffenceNamePage.autoCompleteInput().click()
    offenceOffenceNamePage.clearTheSelection().click()
    offenceOffenceNamePage.autoCompleteInput().should('have.value', '')
  })

  context('Entering an offence via the Offence Name route', () => {
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

      // Unknown Code Step → Name Entry
      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.unknownCodeCheckbox().check()
      offenceOffenceCodePage.continueButton().click()

      // Now we are on OffenceOffenceNamePage for both tests
    })

    it('navigates to the offence-confirmation page when not schedule part 11', () => {
      offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
      offenceOffenceNamePage.autoCompleteInput().type('PS90037 An offence description')
      offenceOffenceNamePage.continueButton().click()

      Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    })

    it('navigates to the aggravated page when offence IS schedule part 11', () => {
      cy.task('stubGetTerrorOffenceByCode', { offenceCode: 'OF61003' })

      offenceOffenceNamePage = Page.verifyOnPage(OffenceOffenceNamePage)
      offenceOffenceNamePage
        .autoCompleteInput()
        .type('OF61003 Solicit to commit murder - Offences Against the Person Act 1861')
      offenceOffenceNamePage.continueButton().click()

      Page.verifyOnPage(OffenceIsOffenceAggravatedPage)
    })
  })
})
