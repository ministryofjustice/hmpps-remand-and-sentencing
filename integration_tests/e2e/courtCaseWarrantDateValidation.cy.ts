import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import Page from '../pages/page'
import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import CourtCaseCourtNamePage from '../pages/courtCaseCourtNamePage'

context('Validation for warrant date page', () => {
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

    it('Run validation on edit journey', () => {
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('12')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('1999')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Warrant date must be after the latest offence date')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2000')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Warrant date must be after the latest offence date')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1899')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Date must be within the last 100 years')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('02')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2000')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseSelectCourtNamePage, 'Was the appearance at Accrington Youth Court?')
    })
  })

  context('Add journey', () => {
    beforeEach(() => {
      cy.task('happyPathStubs')
      cy.signIn()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    })

    it('Run validation on edit journey', () => {
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1899')
      courtCaseWarrantDatePage.continueButton().click()
      courtCaseWarrantDatePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Date must be within the last 100 years')

      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('01')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('12')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('1999')
      courtCaseWarrantDatePage.continueButton().click()
      Page.verifyOnPageTitle(CourtCaseCourtNamePage, 'What is the court name?')
    })
  })
})
