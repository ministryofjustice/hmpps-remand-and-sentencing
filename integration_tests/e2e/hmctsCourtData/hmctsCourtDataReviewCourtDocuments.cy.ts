import Page from '../../pages/page'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseOverallCaseOutcomeAppliedAllPage from '../../pages/courtCaseOverallCaseOutcomeAppliedAllPage'
import HmctsCourtDataLandingPage from '../../pages/hmctsCourtDataLandingPage'
import UploadRemandCourtDocumentsPage from '../../pages/uploadRemandCourtDocumentsPage'

context('Review court documents ingested from Common Platform', () => {
  const remandWarrantHearingId = 'abf395c2-8e3c-419c-bd9c-71d544e5d811'

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubHmctsRemandCourtData')
    cy.task('stubGetAppearanceTypeByUuid')
    cy.signIn()
    cy.visit(`/person/A1234AB/review-new-documents/${remandWarrantHearingId}/landing`)

    const landingPage = Page.verifyOnPage(HmctsCourtDataLandingPage)
    landingPage.continueLink().click()

    const courtCaseOverallCaseOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    courtCaseOverallCaseOutcomePage.radioLabelContains('Remanded in custody').click()
    courtCaseOverallCaseOutcomePage.continueButton().click()

    const courtCaseAddHearingInformationPage = Page.verifyOnPage(CourtCaseOverallCaseOutcomeAppliedAllPage)
    courtCaseAddHearingInformationPage.radioLabelContains('Yes').click()
    courtCaseAddHearingInformationPage.continueButton().click()
  })

  it('shows the number of documents added once a Common Platform document is associated with the case', () => {
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.taskList().getTaskList().should('deep.include', {
      name: 'Review court documents',
      status: '1 document uploaded',
    })
  })

  it('selecting "Review court documents" redirects to the Upload court documents screen', () => {
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.reviewCourtDocumentsLink().click()

    const uploadCourtDocumentsPage = Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    uploadCourtDocumentsPage.documentLink('court-document.pdf').should('be.visible')
    uploadCourtDocumentsPage.commonPlatformTag('court-document.pdf').should('contain.text', 'Common platform')
  })

  it('shows the "Common platform" label against each Common Platform document and hides the delete option', () => {
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.reviewCourtDocumentsLink().click()

    const uploadCourtDocumentsPage = Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    uploadCourtDocumentsPage.commonPlatformTag('court-document.pdf').should('contain.text', 'Common platform')
    uploadCourtDocumentsPage.removeDocumentLink('HMCTS_WARRANT').should('not.exist')
  })

  it('selecting continue on the upload court documents screen returns to the task list with the status retained', () => {
    const courtCaseTaskListPage = Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    courtCaseTaskListPage.reviewCourtDocumentsLink().click()

    const uploadCourtDocumentsPage = Page.verifyOnPage(UploadRemandCourtDocumentsPage)
    uploadCourtDocumentsPage.continueButton().click()

    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case').taskList().getTaskList().should('deep.include', {
      name: 'Review court documents',
      status: '1 document uploaded',
    })
  })
})
