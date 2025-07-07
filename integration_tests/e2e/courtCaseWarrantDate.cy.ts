import dayjs from 'dayjs'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'
import CourtCaseCheckAnswersPage from '../pages/courtCaseCheckAnswersPage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'
import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'

context('Court Case Warrant Date Page', () => {
  context('Add journey', () => {
    let courtCaseWarrantDatePage: CourtCaseWarrantDatePage
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.signIn()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    })

    it('displays person details', () => {
      courtCaseWarrantDatePage
        .prisonerBanner()
        .should('contain.text', 'Meza, Cormac')
        .and('contain.text', 'A1234AB')
        .and('contain.text', 'EstablishmentHMP Bedford')
        .and('contain.text', 'Cell numberCELL-1')
    })

    it('button to continue is displayed', () => {
      courtCaseWarrantDatePage.continueButton().should('contain.text', 'Continue')
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

  context('Edit journey', () => {
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

    it('Run validation on edit journey - check for appropriate error messages', () => {
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
})
