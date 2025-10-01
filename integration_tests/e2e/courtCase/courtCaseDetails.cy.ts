import CourtCaseDetailsPage from '../../pages/courtCaseDetailsPage'
import Page from '../../pages/page'
import CourtCaseDeleteAppearancePage from '../../pages/courtCaseDeleteAppearancePage'

context('Court Case details Page', () => {
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
        'Appearances for C894623 at Accrington Youth Court',
      )
    })

    it('appearance shows correct data', () => {
      // should render 2 appearances
      cy.get('[data-qa="appearance"]').should('have.length', 2)

      // first appearance
      cy.get('[data-qa="appearance"]')
        .eq(0)
        .within(() => {
          cy.get('[data-qa="case-reference"]').should('contain.text', 'C894623')
          cy.get('[data-qa="location"]').should('contain.text', 'Accrington Youth Court')
          cy.get('[data-qa="warrant-date"]').should('contain.text', '15/12/2023')
          cy.get('[data-qa="outcome"]').should('contain.text', 'Remanded in custody')
          cy.get('[data-qa="next-hearing"]').should('contain.text', '15/12/2024 at Accrington Youth Court')
          cy.get('[data-qa="court-documents"]').should('contain.text', 'No documents uploaded')
          cy.get('[data-qa="offences"]').should('contain.text', 'offences (2)')
        })

      // second appearance
      cy.get('[data-qa="appearance"]')
        .eq(1)
        .within(() => {
          cy.get('[data-qa="case-reference"]').should('contain.text', 'F23325')
          cy.get('[data-qa="location"]').should('contain.text', 'Birmingham Crown Court')
          cy.get('[data-qa="warrant-date"]').should('contain.text', '15/10/2022')
          cy.get('[data-qa="outcome"]').should('contain.text', 'Lie on file')
          cy.get('[data-qa="next-hearing"]').should('contain.text', '15/12/2023 at Birmingham Crown Court')
          cy.get('[data-qa="court-documents"]').should('contain.text', 'No documents uploaded')
          cy.get('[data-qa="offences"]').should('contain.text', 'offences (1)')
        })
    })

    it('should show delete button', () => {
      courtCaseDetailsPage
        .appearanceActionList('a6400fd8-aef4-4567-b18c-d1f452651933')
        .children()
        .should('have.length', 2)
        .and('contain.text', 'Delete')
    })

    it('should delete an appearance and return to court case details page', () => {
      cy.task('stubGetAppearanceByUuid')
      cy.task('stubGetCourtById', {
        courtId: 'ACCRYC',
        courtName: 'Accrington Youth Court',
      })
      cy.task('stubDeleteAppearanceByUuid')
      courtCaseDetailsPage
        .deleteAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', 'a6400fd8-aef4-4567-b18c-d1f452651933')
        .click()

      const deleteAppearancePage = Page.verifyOnPage(CourtCaseDeleteAppearancePage)
      deleteAppearancePage.deleteButton().click()
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )
    })
    it('should show mergedFrom details', () => {
      courtCaseDetailsPage
        .mergedCaseInset()
        .should('contain.text', 'Offences from NOMIS123 were merged with this appearance on 05/06/2019')
    })
  })

  context('Latest sentence appearance', () => {
    beforeEach(() => {
      cy.task('stubGetCourtCaseSentenceLatest')
      cy.task('stubGetCourtsByIds')
      cy.signIn()
      cy.visit('/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/details')
      courtCaseDetailsPage = Page.verifyOnPageTitle(
        CourtCaseDetailsPage,
        'Appearances for C894623 at Accrington Youth Court',
      )
    })

    it('appearance shows correct data', () => {
      // ensure 2 appearances are shown
      cy.get('[data-qa="appearance"]').should('have.length', 2)

      // first appearance
      cy.get('[data-qa="appearance"]')
        .eq(0)
        .within(() => {
          cy.get('[data-qa="case-reference"]').should('contain.text', 'C894623')
          cy.get('[data-qa="warrant-date"]').should('contain.text', '15/12/2023')
          cy.get('[data-qa="location"]').should('contain.text', 'Accrington Youth Court')
          cy.get('[data-qa="outcome"]').should('contain.text', 'Imprisonment')
          cy.get('[data-qa="court-documents"]').should('contain.text', 'No documents uploaded')

          // offences (4)
          cy.get('[data-qa="offences"]').should('contain.text', 'offences (4)')
          cy.get('[data-qa="offences"]').should('contain.text', 'PS90037 An offence description')
          cy.get('[data-qa="offences"]').should('contain.text', 'Committed on')
          cy.get('[data-qa="offences"]').should('contain.text', 'Sentence type')
          cy.get('[data-qa="offences"]').should('contain.text', 'Sentence length')
          cy.get('[data-qa="offences"]').should('contain.text', 'Consecutive or concurrent')
        })

      // second appearance
      cy.get('[data-qa="appearance"]')
        .eq(1)
        .within(() => {
          cy.get('[data-qa="case-reference"]').should('contain.text', 'F23325')
          cy.get('[data-qa="warrant-date"]').should('contain.text', '15/10/2022')
          cy.get('[data-qa="location"]').should('contain.text', 'Birmingham Crown Court')
          cy.get('[data-qa="outcome"]').should('contain.text', 'A Nomis Outcome')
          cy.get('[data-qa="court-documents"]').should('contain.text', 'No documents uploaded')

          // offences (1)
          cy.get('[data-qa="offences"]').should('contain.text', 'offences (1)')
          cy.get('[data-qa="offences"]').within(() => {
            cy.contains('dt', 'Committed on') // check the label
            cy.contains('dd', '15/12/2023') // check the value
            cy.contains('dt', 'Outcome')
            cy.contains('dd', 'Remanded in custody')
          })
        })
    })

    it('Drafts tab should not display', () => {
      courtCaseDetailsPage.draftsTab().should('not.exist')
    })

    it('do not show edit or delete when appearance contains a recall', () => {
      courtCaseDetailsPage
        .appearanceActionList('a6400fd8-aef4-4567-b18c-d1f452651933')
        .children()
        .should('have.length', 0)
    })

    it('show edit or delete when appearance has no recalls', () => {
      courtCaseDetailsPage
        .appearanceActionList('5b4cbea0-edd3-4bac-9485-b3e3cd46ad77')
        .children()
        .should('have.length', 2)
    })
  })
})
