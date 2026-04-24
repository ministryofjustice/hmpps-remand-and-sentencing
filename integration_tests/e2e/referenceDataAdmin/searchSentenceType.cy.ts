import Page from '../../pages/page'
import SearchSentenceTypePage from '../../pages/SearchSentenceTypePage'
import AdminSentenceTypePage from '../../pages/AdminSentenceTypePage'

context('Search sentence type page', () => {
  let searchSentenceTypePage: SearchSentenceTypePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllSentenceTypes')
    cy.task('stubGetSentenceTypeChargeOutcomes')
    cy.signIn()
    cy.visit('/admin/sentence-type')
    const adminSentenceTypePage = Page.verifyOnPage(AdminSentenceTypePage)
    adminSentenceTypePage.searchLink().click()
    searchSentenceTypePage = Page.verifyOnPage(SearchSentenceTypePage)
  })

  it('validate mandatory search parameters', () => {
    searchSentenceTypePage.searchButton().click()
    searchSentenceTypePage = Page.verifyOnPage(SearchSentenceTypePage)
    searchSentenceTypePage
      .errorSummary()
      .trimTextContent()
      .should(
        'equal',
        'There is a problem You must select a conviction date You must select an offence date You must supply an age at conviction',
      )
  })

  it('display empty state when no sentence types', () => {
    cy.task('stubEmptySearchSentenceTypes')
    searchSentenceTypePage.convictionDateInput().type('15/3/2020')
    searchSentenceTypePage.offenceDateInput().type('15/3/2020')
    searchSentenceTypePage.ageAtConvictionInput().type('25')
    searchSentenceTypePage.searchButton().click()
    searchSentenceTypePage = Page.verifyOnPage(SearchSentenceTypePage)
    searchSentenceTypePage
      .content()
      .trimTextContent()
      .should('equal', 'There are no matching sentence types Check the search criteria entered and try again.')
  })
})
