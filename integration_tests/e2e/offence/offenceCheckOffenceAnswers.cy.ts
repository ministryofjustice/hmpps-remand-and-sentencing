import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceDeleteOffencePage from '../../pages/offenceDeleteOffencePage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import Page from '../../pages/page'

context('Check Offence Answers Page', () => {
  let offenceCheckOffenceAnswersPage: OffenceCheckOffenceAnswersPage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetCourtById', {})
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
        outcomeName: 'Remanded in custody',
        outcomeType: 'REMAND',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {})
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
  })

  context('remand', () => {
    beforeEach(() => {
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').clear().type('14')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').clear().type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').clear().type('2025')
      courtCaseWarrantDatePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
    })
    it('deleting offence removes from list and goes back to check answers page', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      cy.get('[data-qa^="edit-offence-link-"]').each($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', chargeUuid).click()
        }
      })

      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
    })

    it('creating a new offence results in showing the offence', () => {
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    })
    it('changing an existing offence results in changes in the offence', () => {
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          outcomeName: 'Lie on file',
          outcomeType: 'NON_CUSTODIAL',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
      })
      let offenceEditOffencePage = null
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      cy.get('[data-qa^="edit-offence-link-"]').each($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
          offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
          offenceEditOffencePage.editFieldLink(chargeUuid, 'offence-outcome').click()
        }
      })

      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.continueButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage.offencesSummaryCard().should('not.exist')
    })
  })

  context('sentencing', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceTypeById', {})
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('14')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    })

    it('deleting sentence removes from list and goes back to check answers page', () => {
      cy.get('[data-qa^="edit-offence-link-"]').each($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', chargeUuid).click()
        }
      })
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.deleteButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
    })

    it('custodial offences appear in custodial offences heading', () => {
      offenceCheckOffenceAnswersPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '12/05/2023',
            'Consecutive or concurrent': 'Forthwith',
            'Conviction date': '13/05/2023',
            Outcome: 'Imprisonment',
            'Sentence length': '4 years 5 months 0 weeks 0 days',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
          },
        ])
      offenceCheckOffenceAnswersPage
        .noNonCustodialOutcomeInset()
        .trimTextContent()
        .should('equal', 'There are no offences with non-custodial outcomes.')
      offenceCheckOffenceAnswersPage.countWarning().should('not.exist')
    })

    it('non custodial offences appear in non custodial offences heading', () => {
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          outcomeName: 'Lie on file',
          outcomeType: 'NON_CUSTODIAL',
        },
      ])
      let offenceEditOffencePage = null
      cy.get('[data-qa^="edit-offence-link-"]').each($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
          offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
          offenceEditOffencePage.editFieldLink(chargeUuid, 'offence-outcome').click()
        }
      })

      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.continueButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage
        .nonCustodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '12/05/2023',
            Outcome: 'Lie on file',
          },
        ])
      offenceCheckOffenceAnswersPage
        .noCustodialOutcomeInset()
        .trimTextContent()
        .should('equal', 'There are no offences with custodial outcomes.')
      offenceCheckOffenceAnswersPage.countWarning().should('not.exist')
    })

    it('display count number warning when at least 1 offence has no count', () => {
      let offenceEditOffencePage = null
      cy.get('[data-qa^="edit-offence-link-"]').each($el => {
        const href = $el.attr('href')
        const match = href.match(/offences\/([a-f0-9-]+)\//)
        if (match) {
          const chargeUuid = match[1]
          offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
          offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
          offenceEditOffencePage.editFieldLink(chargeUuid, 'count-number').click()
        }
      })

      const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
      offenceCountNumberPage.radioLabelSelector('false').click()
      offenceCountNumberPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.continueButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage
        .countWarning()
        .trimTextContent()
        .should('equal', '! Warning There are missing count numbers. Please add these where possible')
    })

    it('changing outcome from custodial to non custodial resets the consecutive chain', () => {
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
        outcomeName: 'Lie on file',
        outcomeType: 'NON_CUSTODIAL',
      })
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '66032e17-977a-40f9-b634-1bc2b45e874d',
          outcomeName: 'Lie on file',
          outcomeType: 'NON_CUSTODIAL',
        },
        {
          outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
      cy.task('stubGetCourtsByIds')
      cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1')
      offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(
        OffenceCheckOffenceAnswersPage,
        'You have added 2 offence',
      )
      let offenceEditOffencePage = null
      cy.get('[data-qa^="edit-offence-link-"]')
        .first()
        .then($el => {
          const href = $el.attr('href')
          const match = href.match(/offences\/([a-f0-9-]+)\//)
          if (match) {
            const chargeUuid = match[1]
            offenceCheckOffenceAnswersPage.editOffenceLink(chargeUuid).click()
            offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
            offenceEditOffencePage.editFieldLink(chargeUuid, 'offence-outcome').click()
          }
        })

      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.continueButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 2 offence')
      offenceCheckOffenceAnswersPage
        .custodialOffences()
        .getOffenceCards()
        .should('deep.equal', [
          {
            offenceCardHeader: 'PS90037 An offence description',
            'Committed on': '10/05/2023',
            'Conviction date': '12/05/2023',
            Outcome: 'Imprisonment',
            'Sentence length': '4 years 5 months 0 weeks 0 days',
            'Sentence type': 'SDS (Standard Determinate Sentence)',
            'Consecutive or concurrent': 'Select consecutive or current',
          },
        ])
      offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
      offenceCheckOffenceAnswersPage.finishAddingButton().click()
      offenceCheckOffenceAnswersPage = Page.verifyOnPageTitle(
        OffenceCheckOffenceAnswersPage,
        'You have added 2 offence',
      )
      offenceCheckOffenceAnswersPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Select consecutive or concurrent')
    })
  })
})
