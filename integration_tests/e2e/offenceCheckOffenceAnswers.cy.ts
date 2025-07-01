import CourtCaseWarrantDatePage from '../pages/courtCaseWarrantDatePage'
import CourtCaseWarrantTypePage from '../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../pages/offenceCheckOffenceAnswersPage'
import OffenceCountNumberPage from '../pages/offenceCountNumberPage'
import OffenceDeleteOffencePage from '../pages/offenceDeleteOffencePage'
import OffenceEditOffencePage from '../pages/offenceEditOffencePage'
import OffenceOffenceOutcomePage from '../pages/offenceOffenceOutcomePage'
import Page from '../pages/page'

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

  it('displays person details', () => {
    offenceCheckOffenceAnswersPage
      .prisonerBanner()
      .should('contain.text', 'Meza, Cormac')
      .and('contain.text', 'A1234AB')
      .and('contain.text', 'EstablishmentHMP Bedford')
      .and('contain.text', 'Cell numberCELL-1')
  })

  it('button add an offence is displayed', () => {
    offenceCheckOffenceAnswersPage.addAnotherButton().should('contain.text', 'Add an offence')
  })

  context('remand', () => {
    beforeEach(() => {
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
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.continueButton().click()
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
      cy.createOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'offence-outcome').click()
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
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('12')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
    })

    it('deleting sentence removes from list and goes back to check answers page', () => {
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.radioLabelSelector('true').click()
      offenceDeleteOffencePage.continueButton().click()
      offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
    })

    it('creating a new sentenced offence results in showing the sentenced offence', () => {
      offenceCheckOffenceAnswersPage.offencesSummaryCard().should('not.exist')
    })

    it('deleting sentence and not selecting yes or no results in error', () => {
      offenceCheckOffenceAnswersPage.deleteOffenceLink('A1234AB', '0', '0', '0').click()
      const offenceDeleteOffencePage = Page.verifyOnPage(OffenceDeleteOffencePage)
      offenceDeleteOffencePage.continueButton().click()
      offenceDeleteOffencePage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem You must select whether you want to delete this sentence')
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
            'Conviction date': '12/05/2023',
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
      cy.visit(
        '/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/offence-outcome?submitToEditOffence=true',
      )
      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Lie on file').click()
      offenceOffenceOutcomePage.continueButton().click()
      const offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
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
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      let offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'count-number').click()
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
  })
})
