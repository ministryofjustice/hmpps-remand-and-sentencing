import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import Page from '../../pages/page'

context('Add Offence Outcome Page', () => {
  let offenceOffenceOutcomePage: OffenceOffenceOutcomePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetAllAppearanceOutcomes')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
      sentenceUuids: '([a-z0-9-]*,)*[a-z0-9-]*',
      hasSentenceAfterOnOtherCourtAppearance: false,
    })
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
        {
          label: 'Replaced with Another Offence',
          checked: false,
        },
      ])
  }

  context('Submitting Remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
      receivedCustodialSentencePage.radioLabelSelector('false').click()
      receivedCustodialSentencePage.continueButton().click()
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
          {
            label: 'Replaced with Another Offence',
            checked: false,
          },
        ])
    })

    it('selects the correct radio button if in review mode', () => {
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      offenceOffenceOutcomePage.radioLabelContains('Remanded in custody').click()
      offenceOffenceOutcomePage.continueButton().click()
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')

      cy.get('[data-qa^="edit-offence-link-"]')
        .first()
        .then($el => {
          const href = $el.attr('href')
          const match = href.match(/offences\/([a-f0-9-]+)\//)
          if (match) {
            const chargeUuid = match[1]
            offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
            const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
            offenceEditOffencePage.editFieldLink(chargeUuid, 'offence-outcome').click()
          }
        })

      offenceOffenceOutcomePage
        .radios()
        .getRadioOptions()
        .should('deep.equal', [
          {
            label: 'Remanded in custody',
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
          {
            label: 'Replaced with Another Offence',
            checked: false,
          },
        ])
    })
  })

  context('Submitting Sentencing', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
      receivedCustodialSentencePage.radioLabelSelector('true').click()
      receivedCustodialSentencePage.continueButton().click()
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
          {
            label: 'Replaced with Another Offence',
            checked: false,
          },
        ]))

    it('displays offence paragraph', () => {
      offenceOffenceOutcomePage.offenceParagraph().should('contain.text', 'PS90037 - An offence description')
    })

    it('selects the correct radio button if in review mode', () => {
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      verifyReviewMode('Imprisonment')
    })
  })
})
