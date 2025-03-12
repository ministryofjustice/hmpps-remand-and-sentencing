import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

context('Add Offence Outcome Page', () => {
  let offenceOffenceOutcomePage: OffenceOffenceOutcomePage

  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.signIn()
  })

  it('displays person details', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    offenceOffenceOutcomePage
      .prisonerBanner()
      .should('contain.text', 'Haggler, Marvin')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button to continue is displayed', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    offenceOffenceOutcomePage.continueButton().should('contain.text', 'Continue')
  })

  it('submitting without selecting anything results in an error', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    offenceOffenceOutcomePage.continueButton().click()
    offenceOffenceOutcomePage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem You must select the offence outcome')
  })

  it('displays Remand and Non-Custodial Outcomes (New Remand)', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    // Verify REMAND outcomes
    cy.get('.govuk-radios__item').contains('Remanded in custody').should('exist')

    // Verify NON_CUSTODIAL outcomes after "or"
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('.govuk-radios__item').contains('Lie on file').should('exist')
  })

  it('displays Remand and Non-Custodial Outcomes (Repeat Remand)', () => {
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    // Select an outcome and submit
    cy.get('.govuk-radios__item').contains('Remanded in custody').click()
    offenceOffenceOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')

    // Navigate back to review offences
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/review-offences')
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Edit the outcome for this offence')

    // Verify REMAND outcomes
    cy.get('.govuk-radios__item').contains('Remanded in custody').should('exist')

    // Verify NON_CUSTODIAL outcomes after "or"
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('.govuk-radios__item').contains('Lie on file').should('exist')
  })

  it('displays Sentencing and Non-Custodial Outcomes (New Sentence)', () => {
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    // Verify SENTENCING outcomes
    cy.get('.govuk-radios__item').contains('Imprisonment').should('exist')

    // Verify NON_CUSTODIAL outcomes after "or"
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('.govuk-radios__item').contains('Lie on file').should('exist')
  })

  it('displays Sentencing and Non-Custodial Outcomes (Remand to Sentencing)', () => {
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/warrant-type')
    const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
    courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
    courtCaseWarrantTypePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Select the outcome for this offence')

    // Select an outcome and submit
    cy.get('.govuk-radios__item').contains('Imprisonment').click()
    offenceOffenceOutcomePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')

    // Navigate back to review offences
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/review-offences')
    cy.visit('/person/A1234AB/edit-court-case/0/edit-court-appearance/0/offences/0/offence-outcome')
    offenceOffenceOutcomePage = Page.verifyOnPageTitle(OffenceOffenceOutcomePage, 'Edit the outcome for this offence')

    // Verify SENTENCING outcomes
    cy.get('.govuk-radios__item').contains('Imprisonment').should('exist')

    // Verify NON_CUSTODIAL outcomes after "or"
    cy.get('.govuk-radios__divider').should('contain.text', 'or')
    cy.get('.govuk-radios__item').contains('Lie on file').should('exist')
  })
})
