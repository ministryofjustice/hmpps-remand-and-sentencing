// import CourtCaseTaggedBailPage from '../pages/courtCaseTaggedBailPage'
// import Page from '../pages/page'

// context('Tagged bail page', () => {
//   let courtCaseTaggedBailPage: CourtCaseTaggedBailPage
//   beforeEach(() => {
//     cy.task('happyPathStubs')
//     cy.signIn()
//     cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/tagged-bail')
//     courtCaseTaggedBailPage = Page.verifyOnPage(CourtCaseTaggedBailPage)
//   })

//   it('displays person details', () => {
//     courtCaseTaggedBailPage
//       .prisonerBanner()
//       .should('contain.text', 'Haggler, Marvin')
//       .and('contain.text', 'A1234AB')
//       .and('contain.text', 'EstablishmentHMP Bedford')
//       .and('contain.text', 'Cell numberCELL-1')
//   })

//   it('button to continue is displayed', () => {
//     courtCaseTaggedBailPage.continueButton().should('contain.text', 'Continue')
//   })

//   it('submitting without selecting anything results in error', () => {
//     courtCaseTaggedBailPage.continueButton().click()
//     courtCaseTaggedBailPage
//       .errorSummary()
//       .trimTextContent()
//       .should('equal', 'There is a problem Enter the number of days for the tagged bail')
//   })

//   it('selecting yes and not entering anything into input results in error', () => {
//     courtCaseTaggedBailPage.radioLabelSelector('true').click()
//     courtCaseTaggedBailPage.continueButton().click()
//     courtCaseTaggedBailPage
//       .errorSummary()
//       .trimTextContent()
//       .should('equal', 'There is a problem Enter the number of days for the tagged bail')
//   })

//   it('selecting yes and entering 0 input results in error', () => {
//     courtCaseTaggedBailPage.radioLabelSelector('true').click()
//     courtCaseTaggedBailPage.input().type('0')
//     courtCaseTaggedBailPage.continueButton().click()
//     courtCaseTaggedBailPage.radioSelector('true').should('be.checked')
//     courtCaseTaggedBailPage
//       .errorSummary()
//       .trimTextContent()
//       .should('equal', 'There is a problem Enter a whole number for the number of days on tagged bail')
//   })

//   it('selecting yes and entering a decimal in input results in error', () => {
//     courtCaseTaggedBailPage.radioLabelSelector('true').click()
//     courtCaseTaggedBailPage.input().type('2.5')
//     courtCaseTaggedBailPage.continueButton().click()
//     courtCaseTaggedBailPage.radioSelector('true').should('be.checked')
//     courtCaseTaggedBailPage
//       .errorSummary()
//       .trimTextContent()
//       .should('equal', 'There is a problem Enter a whole number for the number of days on tagged bail')
//   })
// })
