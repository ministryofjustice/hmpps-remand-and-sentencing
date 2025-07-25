import dayjs from 'dayjs'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import StartPage from '../pages/startPage'
import OffenceOffenceDatePage from '../pages/offenceOffenceDatePage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../pages/offenceOffenceCodeConfirmPage'
import CourtCaseDetailsPage from '../pages/courtCaseDetailsPage'
import CourtCaseAppearanceDetailsPage from '../pages/courtCaseAppearanceDetailsPage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import CourtCaseTaskListPage from '../pages/courtCaseTaskListPage'
import CourtCaseReferencePage from '../pages/courtCaseReferencePage'
import CourtCaseOverallCaseOutcomePage from '../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPage from '../pages/courtCaseCaseOutcomeAppliedAllPage'

context('Court Case Warrant Date Page', () => {
  context('Add court case and add appearance journey', () => {
    let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.signIn()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    })

    it('submitting without entering anything in the inputs results in an error', () => {
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should(
          'equal',
          'There is a problem Warrant date must include day Warrant date must include month Warrant date must include year',
        )
    })

    it('submitting an invalid date results in an error', () => {
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('35')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('1')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2024')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem This date does not exist.')
    })

    it('submitting a date in the future results in an error', () => {
      const futureDate = dayjs().add(7, 'day')
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type(futureDate.date().toString())
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type((futureDate.month() + 1).toString())
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type(futureDate.year().toString())
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem The warrant date cannot be a date in the future')
    })

    it('after confirm and continue check answers this becomes uneditable', () => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/check-answers')
      const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)
      courtCaseCheckAnswersPage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You cannot submit after confirming appearance information')
    })

    it('Warrant date must be within the last 100 years', () => {
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1899')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('12')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1999')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    })
  })

  context('Edit court case and add appearance journey', () => {
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.signIn()
      cy.task('stubGetCourtById', {})
      cy.task('stubGetLatestCourtAppearance', {})
      cy.task('stubGetLatestOffenceDate', {})
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/warrant-date',
      )
    })

    it('Run validation and check for appropriate error messages', () => {
      // Latest offence date has been mocked to return 01-01-2000
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('12')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('1999')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should(
          'equal',
          'There is a problem The warrant date must be after any existing offence dates in the court case',
        )

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2000')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should(
          'equal',
          'There is a problem The warrant date must be after any existing offence dates in the court case',
        )

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1899')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem All dates must be within the last 100 years from today’s date')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('02')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2000')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseSelectCourtNamePage, 'Was the appearance at Accrington Youth Court?')
    })
  })

  context('Edit appearance journey validation of warrant page', () => {
    const futureDate = dayjs().add(10, 'day')
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubSearchCourtCases', {})
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetLatestCourtAppearance', {})
      cy.task('stubCreateCourtAppearance', { nextHearingDate: futureDate.format('YYYY-MM-DD') })
      cy.task('stubCreateSentenceCourtAppearance')
      cy.task('stubGetCourtById', {})
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetAllChargeOutcomes')
      cy.task('stubOverallSentenceLengthPass')
      cy.task('stubGetServiceDefinitions')
      cy.task('stubGetAllAppearanceOutcomes')
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.signIn()
      cy.visit('/person/A1234AB')
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.task('stubGetAppearanceTypeByUuid')
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      })
      cy.task('stubGetCourtCaseRemandLatest')
      cy.task('stubGetRemandAppearanceDetails', 'a6400fd8-aef4-4567-b18c-d1f452651933')
      cy.task('stubGetLatestOffenceDateExcludeAppearance', {})
    })

    it('Edit Remand journey validation - warrant date must be after offence dates', () => {
      // Ensure validation occurs for the persisted offence (returned from api call) - offence start date is 2023-12-15
      const startPage = Page.verifyOnPage(StartPage)
      startPage.editAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6').click()
      const courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )

      courtCaseDetailsPage
        .editAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      editWarrantDate(courtCaseAppearanceDetailsPage)

      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      enterWarrantDate(courtCaseWarrantDatePage, '15', '12', '2023')
      expectWarrantDateError(courtCaseWarrantDatePage)

      enterWarrantDate(courtCaseWarrantDatePage, '16', '12', '2023')
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')

      // Modify the offence (in session) and ensure validation occurs for that
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933', '0')
        .click()

      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage
        .editFieldLink(
          'A1234AB',
          'edit',
          '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          'edit',
          'a6400fd8-aef4-4567-b18c-d1f452651933',
          '0',
          'offence-date',
        )
        .click()
      Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
      enterOffenceStartDate('16', '12', '2023')

      offenceEditOffencePage.continueButton().click()

      editWarrantDate(courtCaseAppearanceDetailsPage)

      enterWarrantDate(courtCaseWarrantDatePage, '16', '12', '2023')
      expectWarrantDateError(courtCaseWarrantDatePage)

      enterWarrantDate(courtCaseWarrantDatePage, '17', '12', '2023')
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')

      // Add new offence to session and ensure validation occurs for that
      courtCaseAppearanceDetailsPage.addAnotherButton().click()
      enterOffenceStartDate('17', '12', '2023')

      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('PS90037')
      offenceOffenceCodePage.continueButton().click()

      const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
      offenceOffenceCodeConfirmPage.continueButton().click()

      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Remanded in custody').click()
      offenceOffenceOutcomePage.continueButton().click()

      editWarrantDate(courtCaseAppearanceDetailsPage)

      enterWarrantDate(courtCaseWarrantDatePage, '17', '12', '2023')
      expectWarrantDateError(courtCaseWarrantDatePage)

      enterWarrantDate(courtCaseWarrantDatePage, '18', '12', '2023')
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })

    it('Run validation against next hearing date', () => {
      // Latest offence date has been mocked to return 15-12-2024
      const startPage = Page.verifyOnPage(StartPage)
      startPage.editAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6').click()
      const courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )

      courtCaseDetailsPage
        .editAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      editWarrantDate(courtCaseAppearanceDetailsPage)

      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      enterWarrantDate(courtCaseWarrantDatePage, '15', '12', '2024')
      expectHearingDateError(courtCaseWarrantDatePage)
      enterWarrantDate(courtCaseWarrantDatePage, '14', '12', '2024')
      Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
    })
  })
  context('Tests for editing via check-your-answers whilst in the add journey', () => {
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.task('stubSearchCourtCases', {})
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetCourtById', {})
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetAllAppearanceOutcomes')
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.signIn()
      cy.visit('/person/A1234AB')
    })
    it('Changing warrant date after check-your-answers navigates correctly when there is a validation error', () => {
      const startPage = Page.verifyOnPage(StartPage)
      startPage.actionListLink().click()

      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()

      const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
      courtCaseTaskListPage.appearanceInformationLink().click()

      const courtCaseReferencePage = Page.verifyOnPageTitle(CourtCaseReferencePage, 'Enter the case reference')
      courtCaseReferencePage.input().type('T12345678')
      courtCaseReferencePage.continueButton().click()
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      const courtCaseCourtNamePage = Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
      courtCaseCourtNamePage.autoCompleteInput().type('cou')
      courtCaseCourtNamePage.firstAutoCompleteOption().contains('Accrington Youth Court')
      courtCaseCourtNamePage.firstAutoCompleteOption().click()
      courtCaseCourtNamePage.continueButton().click()

      const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
        CourtCaseOverallCaseOutcomePage,
        'Select the overall case outcome',
      )
      courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
      courtCaseOverallCaseOutcomePage.continueButton().click()

      const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPage)
      courtCaseCaseOutcomeAppliedAllPage.bodyText().should('contain.text', 'Remanded in custody')

      courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
      courtCaseCaseOutcomeAppliedAllPage.continueButton().click()

      const courtCaseCheckAnswersPage = Page.verifyOnPage(CourtCaseCheckAnswersPage)

      courtCaseCheckAnswersPage.editFieldLink('A1234AB', 'add', '1', 'add', '0', 'warrant-date', true).click()

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('55')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem This date does not exist.')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('15')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPage(CourtCaseCheckAnswersPage)
    })
  })
})

function enterWarrantDate(page, day: string, month: string, year: string) {
  page.dayDateInput('warrantDate').clear().type(day)
  page.monthDateInput('warrantDate').clear().type(month)
  page.yearDateInput('warrantDate').clear().type(year)
  page.continueButton().click()
}

function expectWarrantDateError(page) {
  page
    .errorSummary()
    .trimTextContent()
    .should('equal', 'There is a problem The warrant date must be after any existing offence dates in the court case')
}

function expectHearingDateError(page) {
  page
    .errorSummary()
    .trimTextContent()
    .should('equal', 'There is a problem The warrant date must be before the next court appearance date')
}

function editWarrantDate(page) {
  page
    .editFieldLink(
      'A1234AB',
      '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      'a6400fd8-aef4-4567-b18c-d1f452651933',
      'warrant-date',
    )
    .click()
}

function enterOffenceStartDate(day: string, month: string, year: string) {
  const page = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
  page.dayDateInput('offenceStartDate').clear().type(day)
  page.monthDateInput('offenceStartDate').clear().type(month)
  page.yearDateInput('offenceStartDate').clear().type(year)
  page.continueButton().click()
}
