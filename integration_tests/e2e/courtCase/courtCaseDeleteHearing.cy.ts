import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import Page from '../../pages/page'
import CourtCaseDeleteHearingPage from '../../pages/courtCaseDeleteHearingPage'
import StartPage from '../../pages/startPage'

context('Court Case Delete Hearing Page', () => {
  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
  })

  context('Latest remand appearance', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseRemandLatest')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Hearings for C894623 at Accrington Youth Court',
      )
    })

    it('should delete a hearing and return to court case details page', () => {
      cy.task('stubGetAppearanceByUuid')
      cy.task('stubGetCourtById', {
        courtId: 'ACCRYC',
        courtName: 'Accrington Youth Court',
      })
      cy.task('stubDeleteAppearanceByUuid', {})
      courtCaseDetailsPage
        .deleteAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const deleteAppearancePage = Page.verifyOnPage(CourtCaseDeleteHearingPage)
      deleteAppearancePage
        .description()
        .should(
          'contain.text',
          'C894623 at Accrington Youth Court on 15/12/2023. All the information for this hearing will be lost.',
        )
      deleteAppearancePage.radioLabelSelector('true').click()
      deleteAppearancePage.continueButton().click()
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Hearings for C894623 at Accrington Youth Court',
      )
      courtCaseDetailsPage.notificationBannerHeading().should('contain.text', 'This hearing has been deleted')
      courtCaseDetailsPage
        .notificationBannerContent()
        .should('contain.text', 'Hearing at Accrington Youth Court on 15/12/2023')
    })

    it('should display error when no option selected', () => {
      cy.task('stubGetAppearanceByUuid')
      cy.task('stubGetCourtById', {
        courtId: 'ACCRYC',
        courtName: 'Accrington Youth Court',
      })
      courtCaseDetailsPage
        .deleteAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const deleteAppearancePage = Page.verifyOnPage(CourtCaseDeleteHearingPage)
      deleteAppearancePage.continueButton().click()
      deleteAppearancePage.errorSummary().should('contain.text', 'You must select an option')
    })
  })

  context('Single hearing', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseWithOneAppearance')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Hearings for C894623 at Accrington Youth Court',
      )
    })

    it('should delete the only hearing and return to start page', () => {
      cy.task('stubGetAppearanceByUuid')
      cy.task('stubGetCourtById', {
        courtId: 'ACCRYC',
        courtName: 'Accrington Youth Court',
      })
      cy.task('stubDeleteAppearanceByUuid', { appearanceUuid: 'a6400fd8-aef4-4567-b18c-d1f452651933' })
      courtCaseDetailsPage
        .deleteAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const deleteAppearancePage = Page.verifyOnPage(CourtCaseDeleteHearingPage)
      deleteAppearancePage
        .description()
        .should(
          'contain.text',
          'C894623 at Accrington Youth Court on 15/12/2023. All the information for this hearing will be lost.',
        )
      deleteAppearancePage
        .lastAppearanceMessage()
        .should(
          'contain.text',
          'This is the only hearing in this court case. Deleting this hearing will also delete the court case.',
        )

      cy.task('stubGetCourtCaseWithNoAppearances')
      cy.task('stubEmptySearchCourtCases', {})

      deleteAppearancePage.radioLabelSelector('true').click()
      deleteAppearancePage.continueButton().click()
      const startPage = Page.verifyOnPage(StartPage)
      startPage.notificationBannerHeading().should('contain.text', 'This court case has been deleted')
      startPage.notificationBannerContent().should('contain.text', 'Court case at Accrington Youth Court on 15/12/2023')
    })
  })
})
