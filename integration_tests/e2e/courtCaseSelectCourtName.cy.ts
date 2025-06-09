import dayjs from 'dayjs'
import CourtCaseSelectCourtNamePage from '../pages/courtCaseSelectCourtNamePage'
import Page from '../pages/page'
import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'

context('Select court name page', () => {
  let courtCaseSelectCourtNamePage: CourtCaseSelectCourtNamePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetLatestCourtAppearance', {})
    cy.task('stubGetCourtById', {})
    cy.signIn()
    cy.visit(
      '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/select-court-name',
    )
    courtCaseSelectCourtNamePage = Page.verifyOnPageTitle(
      CourtCaseSelectCourtNamePage,
      'Was the appearance at Accrington Youth Court?',
    )
  })

  it('displays person details', () => {
    courtCaseSelectCourtNamePage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    courtCaseSelectCourtNamePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything in the input results in an error', () => {
    courtCaseSelectCourtNamePage.continueButton().click()
    courtCaseSelectCourtNamePage
      .errorSummary()
      .trimTextContent()
      .should('equal', "There is a problem Select 'Yes' if the appearance was at this court.")
  })

  it('gets next hearing court if warrante date is the same as next hearing date of latest court appearance', () => {
    const warrantDate = dayjs().subtract(10, 'day')
    cy.task('stubGetLatestCourtAppearanceSameNextHearingDate', { warrantDate: warrantDate.format('YYYY-MM-DD') })
    cy.task('stubGetCourtById', {
      courtId: 'WRTH',
      courtName: 'Worthing County Court',
    })
    cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/1/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type(warrantDate.date().toString())
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type((warrantDate.month() + 1).toString())
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type(warrantDate.year().toString())
    courtCaseWarrantDatePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseSelectCourtNamePage, 'Was the appearance at Worthing County Court?')
  })
})
