import Page from '../../pages/page'
import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import ConfirmMarkCourtCaseStatusPage from '../../pages/confirmMarkCourtCaseStatusPage'
import CannotMarkCourtCaseAsInactiveActiveSentencesPage from '../../pages/cannotMarkCourtCaseAsInactiveActiveSentencesPage'

context('Mark court case as active/inactive', () => {
  const courtCaseUuid = '83517113-5c14-4628-9133-1e3cb12e31fa'
  const detailsUrl = `/person/A1234AB/edit-court-case/${courtCaseUuid}/details`
  const confirmInactiveTitle = 'Are you sure you want to mark this court case as inactive?'
  const confirmActiveTitle = 'Are you sure you want to mark this court case as active?'

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

  context('Button visibility', () => {
    it('shows "Mark case as inactive" when the court case is ACTIVE', () => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.markCourtCaseAsInactiveButton().should('be.visible')
      courtCaseDetailsPage.markCourtCaseAsActiveButton().should('not.exist')
    })

    it('shows "Mark case as active" when the court case is INACTIVE', () => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'INACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.signIn()
      cy.visit(detailsUrl)
      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.markCourtCaseAsActiveButton().should('be.visible')
      courtCaseDetailsPage.markCourtCaseAsInactiveButton().should('not.exist')
    })
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

      Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
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

  context('Confirm page — mark as inactive (navigation only, reason capture not yet built)', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseDetails', {
        courtCaseUuid,
        status: 'ACTIVE',
        appearances: [appearance('INACTIVE')],
      })
      cy.signIn()
      cy.visit(`/person/A1234AB/edit-court-case/${courtCaseUuid}/confirm-mark-court-case-as-inactive`)
    })

    it('shows the case reference and court name', () => {
      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
      confirmPage.subheading().should('contain.text', '1234567 at Southampton Magistrate Court')
    })

    it('navigates to the provide-a-reason page when Yes is chosen', () => {
      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
      confirmPage.radioLabelSelector('true').click()
      confirmPage.confirmAndContinueButton().click()

      cy.get('h1').should('contain.text', 'Provide a reason you want to mark this case as inactive')
    })

    it('navigates back to the hearings page when No is chosen', () => {
      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
      confirmPage.radioLabelSelector('false').click()
      confirmPage.confirmAndContinueButton().click()

      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })

    it('shows a validation error when no option is selected', () => {
      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
      confirmPage.confirmAndContinueButton().click()

      Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmInactiveTitle)
      cy.get('.govuk-error-summary').should('contain.text', 'There is a problem')
      cy.get('.govuk-error-summary').should(
        'contain.text',
        "Select 'Yes' if you want to mark this court case as inactive",
      )
    })

    it('back link returns to the hearings page', () => {
      cy.get('[data-qa="back-link"]').click()
      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
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

    it('shows the "Mark case as active" button, which links to the confirm page', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().should('be.visible')
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
      confirmPage.subheading().should('contain.text', '1234567 at Southampton Magistrate Court')
    })

    it('happy path: choosing Yes marks the case active and shows the success banner', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
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

      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
      confirmPage.radioLabelSelector('false').click()
      confirmPage.confirmAndContinueButton().click()

      courtCaseDetailsPage = Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
      courtCaseDetailsPage.courtCaseStatusChangeSuccessBanner().should('not.exist')
    })

    it('shows a validation error when no option is selected', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      const confirmPage = Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
      confirmPage.confirmAndContinueButton().click()

      Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
      cy.get('.govuk-error-summary').should('contain.text', 'There is a problem')
      cy.get('.govuk-error-summary').should(
        'contain.text',
        "Select 'Yes' if you want to mark this court case as active",
      )
    })

    it('back link returns to the hearings page', () => {
      courtCaseDetailsPage.markCourtCaseAsActiveButton().click()

      Page.verifyOnPageTitle(ConfirmMarkCourtCaseStatusPage, confirmActiveTitle)
      cy.get('[data-qa="back-link"]').click()
      Page.verifyOnPageTitle(CourtCaseDetailsPage, 'Hearings for 1234567 at')
    })
  })
})
