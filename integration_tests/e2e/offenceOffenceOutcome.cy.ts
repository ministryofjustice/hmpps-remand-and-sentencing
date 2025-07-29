import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceOffenceCodePage from '../pages/offenceOffenceCodePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

context('Add Offence Outcome Page', () => {
  let offenceOffenceOutcomePage: OffenceOffenceOutcomePage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.signIn()
  })

  const verifyReviewMode = (label: string) => {
    cy.get('.govuk-radios__item').contains(label).click()
    offenceOffenceOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome?review=true')
    offenceOffenceOutcomePage
      .radios()
      .getRadioOptions()
      .should('deep.equal', [
        {
          label,
          checked: true,
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
  }

  context('Submitting Remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('PS90037')
      offenceOffenceCodePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
      offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
    })

    it('submitting without selecting anything results in an error', () => {
      offenceOffenceOutcomePage.continueButton().click()
      offenceOffenceOutcomePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must select the offence outcome')
    })

    it('displays remand and non custodial outcomes', () => {
      offenceOffenceOutcomePage
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

    it('selects the correct radio button if in review mode', () => {
      verifyReviewMode('Remanded in custody')
    })
  })

  context('Submitting Sentencing', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-code')
      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().type('PS90037')
      offenceOffenceCodePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
      offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
    })

    it('displays sentencing and non custodial outcomes', () =>
      offenceOffenceOutcomePage
        .radios()
        .getRadioOptions()
        .should('deep.equal', [
          {
            label: 'Imprisonment',
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
        ]))

    it('displays offence paragraph', () => {
      offenceOffenceOutcomePage.offenceParagraph().should('contain.text', 'PS90037 - An offence description')
    })

    it('selects the correct radio button if in review mode', () => {
      verifyReviewMode('Imprisonment')
    })
  })
})
