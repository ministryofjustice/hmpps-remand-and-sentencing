import Page from '../../../pages/page'
import StartPage from '../../../pages/startPage'
import ViewF986DocumentsPage from '../../../pages/viewF986DocumentsPage'

interface CourtHearingWithFine {
  appearanceUuid: string
  warrantDate: string
  courtCode: string
  caseReference: string
  offenceCodes: string[]
}

const courtHearingWithFine1: CourtHearingWithFine = {
  appearanceUuid: '09E8CB82-BDB4-4CFD-9603-53A45EC748E1',
  warrantDate: '2026-09-15',
  courtCode: 'ACCRYC',
  caseReference: 'C894623',
  offenceCodes: ['PS90037'],
}
const courtHearingWithFine2: CourtHearingWithFine = {
  appearanceUuid: '641931E3-FCD9-41A0-8D2D-BFFC6AE6DE18',
  warrantDate: '2026-03-02',
  courtCode: 'ACCRYC',
  caseReference: 'C894623',
  offenceCodes: ['PS90037'],
}

const documentUrl = (prisonerId: string, appearanceUuid: string) =>
  `/api/persons/${prisonerId}/court-appearances/${appearanceUuid}/documents/f986`
const selectionUrl = '/person/A1234AB/view-generated-documents/type/f986'
const notEligibleMessage = 'There is no eligible F986 form to view for this prisoner'

const stubF986 = (appearances: CourtHearingWithFine[] = [], prisonerId = 'A1234AB') => {
  cy.task('stubSearchCourtCases', { sortBy: 'STATUS_APPEARANCE_DATE_DESC' })
  cy.task('stubGetF986EligibleAppearances', { prisonerId, appearances })
  cy.task('stubHasF986EligibleAppearances', { prisonerId, exists: appearances.length > 0 })
}

context('View F986 generated document', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetServiceDefinitions')
    cy.task('stubGetConsecutiveToDetails', {})
    cy.task('stubGetCourtAppearanceForF986')
    cy.task('stubGetAgencyDetails')
    cy.task('stubGenerateF986Document')
    cy.signIn()
  })

  context('Entry point and selection page', () => {
    beforeEach(() => {
      stubF986([courtHearingWithFine1])
    })

    it('should show the "View a F986 form" link in the Actions list', () => {
      cy.visit('/person/A1234AB')
      const startPage = Page.verifyOnPage(StartPage)
      cy.get('.actions-list').find('[data-qa=view-f986-form-link]').should('exist')
      startPage
        .viewF986Link()
        .should('be.visible')
        .and('contain.text', 'View a F986')
        .and('have.attr', 'href', '/person/A1234AB/view-generated-documents/type/f986')
    })

    it('should navigate to the selection page with radio, view and cancel buttons', () => {
      cy.visit('/person/A1234AB')
      Page.verifyOnPage(StartPage).viewF986Link().click()
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      cy.url().should('include', selectionUrl)
      page.radios().should('have.length', 1)
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine1.appearanceUuid)).should('exist')
      page.viewButton().should('contain.text', 'View')
      page.cancelButton().should('contain.text', 'Cancel')
    })
  })

  context('No eligible outcome', () => {
    beforeEach(() => {
      stubF986([])
    })

    it('should not show the link', () => {
      cy.visit('/person/A1234AB')
      Page.verifyOnPage(StartPage).viewF986Link().should('not.exist')
    })

    it('should show the no eligible form message and no radio buttons when navigating directly', () => {
      cy.visit(selectionUrl)
      cy.get('[data-qa=no-f986-appearances]').should('contain.text', notEligibleMessage)
      cy.get('input[name=documentSelected]').should('not.exist')
      cy.get('[data-qa=view-button]').should('not.exist')
    })
  })

  context('Multiple eligible court appearances', () => {
    beforeEach(() => {
      stubF986([courtHearingWithFine1, courtHearingWithFine2])
      cy.visit(selectionUrl)
    })

    it('should list each eligible case as a separate radio button', () => {
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      page.radios().should('have.length', 2)
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine1.appearanceUuid)).should('exist')
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine2.appearanceUuid)).should('exist')
    })

    it('should only allow one case to be selected at a time', () => {
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine1.appearanceUuid)).check()
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine2.appearanceUuid)).check()
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine1.appearanceUuid)).should('not.be.checked')
      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine2.appearanceUuid)).should('be.checked')
    })

    it('should open the selected case document in a new tab', () => {
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      // We can't open a second tab so just assert the window.open was called
      cy.window().then(win => cy.stub(win, 'open').as('windowOpen'))

      page.radioForDocument(documentUrl('A1234AB', courtHearingWithFine2.appearanceUuid)).check()
      page.viewButton().click()

      cy.get('@windowOpen').should(
        'have.been.calledOnceWith',
        documentUrl('A1234AB', courtHearingWithFine2.appearanceUuid),
        '_blank',
        'noopener',
      )
      cy.url().should('include', selectionUrl)
    })

    it('should serve each selected document as an inline PDF', () => {
      ;[courtHearingWithFine1, courtHearingWithFine2].forEach(c => {
        cy.request(documentUrl('A1234AB', c.appearanceUuid)).then(response => {
          expect(response.status).to.eq(200)
          expect(response.headers['content-type']).to.contain('application/pdf')
          expect(response.headers['content-disposition']).to.contain('inline')
        })
      })
    })
  })

  context('View or cancel', () => {
    beforeEach(() => {
      stubF986([courtHearingWithFine1])
      cy.visit('/person/A1234AB')
      Page.verifyOnPage(StartPage).viewF986Link().click()
    })

    it('should click cancel and return to the Court Cases page without opening a document', () => {
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      cy.window().then(win => cy.stub(win, 'open').as('windowOpen'))
      page.cancelButton().click()
      Page.verifyOnPage(StartPage)
      cy.get('@windowOpen').should('not.have.been.called')
    })

    it('should not open new tab when no case is selected and view clicked', () => {
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      cy.window().then(win => cy.stub(win, 'open').as('windowOpen'))
      page.viewButton().click()
      cy.get('.govuk-error-message').should('contain.text', 'Select which document to view')
      cy.get('@windowOpen').should('not.have.been.called')
    })
  })

  context('No eligible form for prisoner in URL', () => {
    beforeEach(() => {
      stubF986([courtHearingWithFine1])
      stubF986([], 'A9999ZZ')
      cy.task('stubGetPrisonerDetailsByNumber', 'A9999ZZ')
    })

    it('should display an error message with the back link above it', () => {
      cy.visit('/person/A9999ZZ/view-generated-documents/type/f986')
      cy.get('[data-qa=no-f986-appearances]').should('contain.text', notEligibleMessage)
      cy.get('[data-qa=back-link]').should('be.visible')
    })
  })

  context('Back button', () => {
    it('should return to the Court Cases page from the selection page and allows reselection', () => {
      stubF986([courtHearingWithFine1])
      cy.visit('/person/A1234AB')
      Page.verifyOnPage(StartPage).viewF986Link().click()
      Page.verifyOnPage(ViewF986DocumentsPage).backLink().click()
      Page.verifyOnPage(StartPage).viewF986Link().click()
      const page = Page.verifyOnPage(ViewF986DocumentsPage)
      page.radios().should('have.length', 1)
    })

    it('should not generate a document when Back is clicked', () => {
      stubF986([courtHearingWithFine1])
      cy.visit('/person/A1234AB')
      Page.verifyOnPage(StartPage).viewF986Link().click()
      cy.window().then(win => cy.stub(win, 'open').as('windowOpen'))
      Page.verifyOnPage(ViewF986DocumentsPage).backLink().click()
      Page.verifyOnPage(StartPage)
      cy.get('@windowOpen').should('not.have.been.called')
    })

    it('should return to the Court Cases page from the no eligible court appearances page', () => {
      stubF986([])
      cy.visit(selectionUrl)
      cy.get('[data-qa=no-f986-appearances]').should('contain.text', notEligibleMessage)
      cy.get('[data-qa=back-link]').click()
      Page.verifyOnPage(StartPage)
    })
  })
})
