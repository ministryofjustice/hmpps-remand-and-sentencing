import Page from '../../pages/page'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import ConfirmMarkCourtCaseAsActivePage from '../../pages/confirmMarkCourtCaseAsActivePage'
import ConfirmMarkCourtCaseAsInactivePage from '../../pages/confirmMarkCourtCaseAsInactivePage'
import CannotMarkCourtCaseAsInactiveActiveSentencesPage from '../../pages/cannotMarkCourtCaseAsInactiveActiveSentencesPage'
import ProvideReasonForMarkingCourtCaseAsInactivePage from '../../pages/provideReasonForMarkingCourtCaseAsInactivePage'

context('Mark court case as active/inactive', () => {
  const courtCaseUuid = '83517113-5c14-4628-9133-1e3cb12e31fa'
  const detailsUrl = `/person/A1234AB/edit-court-case/${courtCaseUuid}/details`

  const appearance = (sentenceStatus: string) => ({
    appearanceUuid: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    appearanceDate: '2025-07-21',
    courtCode: 'STHHPM',
    warrantType: 'SENTENCING',
    courtCaseReference: '1234567',
    outcome: { outcomeUuid: '1', outcomeName: 'Imprisonment' },
    charges: [
      {
        chargeUuid: '11111111-1111-4111-8111-111111111111',
        offenceCode: 'PS90037',
        offenceStartDate: '2025-07-21',
        outcome: { outcomeUuid: '1', outcomeName: 'Imprisonment' },
        sentence: {
          sentenceUuid: '22222222-2222-4222-8222-222222222222',
          countNumber: '1',
          sentenceServeType: 'FORTHWITH',
          status: sentenceStatus,
        },
      },
    ],
    source: 'DPS',
    deleteStatus: 'SUPPORTED',
    periodLengths: [],
  })

  let courtCaseDetailsPage: CourtCaseDetailsPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetCourtById', { courtId: 'STHHPM', courtName: 'Southampton Magistrate Court' })
  })

  context('Navigation from "Mark case as inactive"', () => {
    it('navigates to the confirm page when no sentence in the case is active', () => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.markCourtCaseAsInactiveButton().click()

      Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
    })

    it('navigates to the blocking page when a sentence in the case is active', () => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('ACTIVE')],
      })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.markCourtCaseAsInactiveButton().click()

      const cannotMarkPage = Page.verifyOnPage(CannotMarkCourtCaseAsInactiveActiveSentencesPage)
      cannotMarkPage.cancelAndGoBackButton().click()
      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })
  })

  context('Confirm page — mark as inactive', () => {
    let confirmInactivePage: ConfirmMarkCourtCaseAsInactivePage
    beforeEach(() => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.signIn()
      cy.visit(`/person/A1234AB/edit-court-case/${courtCaseUuid}/confirm-mark-court-case-as-inactive`)
      confirmInactivePage = Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
    })

    it('shows the case reference and court name', () => {
      confirmInactivePage.subheading().should('contain.text', '1234567 at Southampton Magistrate Court')
    })

    it('navigates to the provide-a-reason page when Yes is chosen', () => {
      confirmInactivePage.radioLabelSelector('true').click()
      confirmInactivePage.confirmAndContinueButton().click()

      cy.get('h1').should('contain.text', 'Provide a reason you want to mark this case as inactive')
    })

    it('navigates back to the hearings page when No is chosen', () => {
      confirmInactivePage.radioLabelSelector('false').click()
      confirmInactivePage.confirmAndContinueButton().click()

      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })

    it('shows a validation error when no option is selected', () => {
      confirmInactivePage.confirmAndContinueButton().click()

      Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
      confirmInactivePage
        .errorSummary()
        .trimTextContent()
        .should('equal', "There is a problem Select 'Yes' if you want to mark this court case as inactive")
    })

    it('back link returns to the hearings page', () => {
      confirmInactivePage.backLink().click()
      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })
  })

  context('Provide a reason page — mark as inactive', () => {
    let provideReasonPage: ProvideReasonForMarkingCourtCaseAsInactivePage
    beforeEach(() => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.task('stubUpdateCourtCaseStatus', { courtCaseUuid })
      cy.signIn()
      cy.visit(`/person/A1234AB/edit-court-case/${courtCaseUuid}/provide-reason-for-marking-court-case-as-inactive`)
      provideReasonPage = Page.verifyOnPage(ProvideReasonForMarkingCourtCaseAsInactivePage)
    })

    it('shows the case reference and court name as hint text', () => {
      provideReasonPage.hint().should('contain.text', '1234567 at Southampton Magistrate Court')
    })

    it('shows a validation error when no reason is entered', () => {
      provideReasonPage.confirmAndSaveButton().click()

      Page.verifyOnPage(ProvideReasonForMarkingCourtCaseAsInactivePage)
      provideReasonPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Enter a reason for marking this case as inactive')
    })

    it('happy path: entering a reason marks the case inactive and shows the success banner', () => {
      provideReasonPage.reasonTextarea().type('No longer required')
      provideReasonPage.confirmAndSaveButton().click()

      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      cy.get('.govuk-notification-banner__title').should('contain.text', 'Success')
      courtCaseDetailsPage
        .courtCaseStatusChangeSuccessBanner()
        .should('contain.text', 'Court case successfully marked inactive')
    })

    it('back link returns to the confirm page', () => {
      provideReasonPage.backLink().click()
      Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
    })

    it('cancel button returns to the confirm page', () => {
      provideReasonPage.cancelButton().click()
      Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
    })
  })

  context('Full journey — mark as inactive', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.task('stubUpdateCourtCaseStatus', { courtCaseUuid })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })

    it('happy path: choosing Yes, then providing a reason, marks the case inactive and shows the success banner', () => {
      courtCaseDetailsPage.markCourtCaseAsInactiveButton().click()

      const confirmPage = Page.verifyOnPage(ConfirmMarkCourtCaseAsInactivePage)
      confirmPage.radioLabelSelector('true').click()
      confirmPage.confirmAndContinueButton().click()

      const provideReasonPage = Page.verifyOnPage(ProvideReasonForMarkingCourtCaseAsInactivePage)
      provideReasonPage.reasonTextarea().type('No longer required')
      provideReasonPage.confirmAndSaveButton().click()

      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      cy.get('.govuk-notification-banner__title').should('contain.text', 'Success')
      courtCaseDetailsPage
        .courtCaseStatusChangeSuccessBanner()
        .should('contain.text', 'Court case successfully marked inactive')
    })
  })

  context('Full journey — mark as active', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'INACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.task('stubUpdateCourtCaseStatus', { courtCaseUuid })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })

    it('happy path: choosing Yes marks the case active and shows the success banner', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().should('be.visible')
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPage(ConfirmMarkCourtCaseAsActivePage)
      confirmPage.radioLabelSelector('true').click()
      confirmPage.confirmAndContinueButton().click()

      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      cy.get('.govuk-notification-banner__title').should('contain.text', 'Success')
      courtCaseDetailsPage
        .courtCaseStatusChangeSuccessBanner()
        .should('contain.text', 'Court case successfully marked active')
    })

    it('choosing No returns to the hearings page without calling the API or showing a banner', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPage(ConfirmMarkCourtCaseAsActivePage)
      confirmPage.radioLabelSelector('false').click()
      confirmPage.confirmAndContinueButton().click()

      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.courtCaseStatusChangeSuccessBanner().should('not.exist')
    })

    it('shows a validation error when no option is selected', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPage(ConfirmMarkCourtCaseAsActivePage)
      confirmPage.confirmAndContinueButton().click()

      Page.verifyOnPage(ConfirmMarkCourtCaseAsActivePage)
      confirmPage
        .errorSummary()
        .trimTextContent()
        .should('equal', "There is a problem Select 'Yes' if you want to mark this court case as active")
    })

    it('back link returns to the hearings page', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPage(ConfirmMarkCourtCaseAsActivePage)
      confirmPage.backLink().click()
      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })
  })
})
