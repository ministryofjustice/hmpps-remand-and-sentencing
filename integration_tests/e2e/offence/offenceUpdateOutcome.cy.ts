import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import OffenceUpdateOutcomePage from '../../pages/offenceUpdateOutcomePage'
import Page from '../../pages/page'
import StartPage from '../../pages/startPage'

context('Update Offence Outcome Page', () => {
  let offenceUpdateOutcomePage: OffenceUpdateOutcomePage
  let startPage: StartPage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubSearchCourtCases', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtsByIds')
    cy.task('stubGetLatestCourtAppearance', {})
    cy.task('stubGetOffenceByCode', {})
    cy.signIn()
    cy.visit('/person/A1234AB')
    startPage = Page.verifyOnPage(StartPage)
  })

  context('Repeat Remand', () => {
    beforeEach(() => {
      startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()

      cy.visit('/person/A1234AB/edit-court-case/0/add-court-appearance/2/offences/0/update-offence-outcome')
      offenceUpdateOutcomePage = Page.verifyOnPage(OffenceUpdateOutcomePage)
    })

    it('submitting without selecting anything results in an error', () => {
      offenceUpdateOutcomePage.continueButton().click()
      offenceUpdateOutcomePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must select the new outcome for this offence')
    })

    it('displays remand and non custodial outcomes', () => {
      offenceUpdateOutcomePage
        .radios()
        .getRadioOptions()
        .should('deep.equal', [
          {
            label: 'Remanded in custody',
            checked: false,
          },
          {
            isDivider: true,
            label: 'or',
          },
          {
            label: 'Lie on file',
            checked: false,
          },
        ])
    })
  })
})
