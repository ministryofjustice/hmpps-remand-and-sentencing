import IndexPage from '../../pages/index'
import AuthSignInPage from '../../pages/authSignIn'
import Page from '../../pages/page'
import AuthErrorPage from '../../pages/authError'
import AuthManageDetailsPage from '../../pages/authManageDetails'
import { Role, Roles } from '../../../server/@types/roles'

context('Sign In', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn')
    cy.task('stubComponentsFail')
    cy.task('stubGetUserCaseload')
  })

  it('Unauthenticated user directed to auth', () => {
    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Unauthenticated user navigating to sign in page directed to auth', () => {
    cy.visit('/sign-in')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User name visible in fallback header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackHeaderUserName().should('contain.text', 'J. Smith')
  })

  it('Phase banner visible in header', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.fallbackHeaderPhaseBanner().should('contain.text', 'dev')
  })

  it('User can sign out', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    indexPage.signOut().click()
    Page.verifyOnPage(AuthSignInPage)
  })

  it('User can manage their details', () => {
    cy.signIn()
    cy.task('stubAuthManageDetails')
    const indexPage = Page.verifyOnPage(IndexPage)

    indexPage.manageDetails().get('a').invoke('removeAttr', 'target')
    indexPage.manageDetails().click()
    Page.verifyOnPage(AuthManageDetailsPage)
  })

  it('Token verification failure takes user to sign in page', () => {
    cy.signIn()
    Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)
  })

  it('Token verification failure clears user session', () => {
    cy.signIn()
    const indexPage = Page.verifyOnPage(IndexPage)
    cy.task('stubVerifyToken', false)

    cy.visit('/')
    Page.verifyOnPage(AuthSignInPage)

    cy.task('stubVerifyToken', true)
    cy.task('stubSignIn', {
      name: 'bobby brown',
      roles: [
        Roles.getAuthority(Role.REMAND_AND_SENTENCING),
        Roles.getAuthority(Role.COURT_CASES),
        Roles.getAuthority(Role.RELEASE_DATES_CALCULATOR),
      ],
    })

    cy.signIn()

    indexPage.fallbackHeaderUserName().contains('B. Brown')
  })

  it('User without release dates calculator role is shown auth error page', () => {
    cy.task('stubSignIn', {
      roles: [Roles.getAuthority(Role.REMAND_AND_SENTENCING), Roles.getAuthority(Role.COURT_CASES)],
    })
    cy.signIn({ failOnStatusCode: false })
    Page.verifyOnPage(AuthErrorPage)
  })

  it('User with no roles is shown auth error page', () => {
    cy.task('stubSignIn', { roles: [] })
    cy.signIn({ failOnStatusCode: false })
    Page.verifyOnPage(AuthErrorPage)
  })
})
