import Page from '../../pages/page'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'
import OffenceAddDuplicatedOffenceDetailsPage from '../../pages/offenceAddDuplicatedOffenceDetailsPage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import CourtCaseCancelCourtCasePage from '../../pages/courtCaseCancelCourtCase'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'

context('Duplicate offence with multiple offence instances enabled', () => {
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetCourtById', {
      courtId: 'STHHPM',
      courtName: 'Southampton Magistrate Court',
    })
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.task('stubGetSentenceTypesByIds', [
      {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        description: 'SDS (Standard Determinate Sentence)',
        classification: 'STANDARD',
      },
    ])
    cy.task('stubGetChargeOutcomesByIds', [
      {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      },
    ])
    cy.task('stubGetChargeOutcomeById', {
      outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
      outcomeName: 'Imprisonment',
      outcomeType: 'SENTENCING',
    })
    cy.task('stubGetHasSentenceToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
    cy.task('stubHasLoopInChain')
    cy.signIn()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const warrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    warrantDatePage.dayDateInput('warrantDate').type('14')
    warrantDatePage.monthDateInput('warrantDate').type('5')
    warrantDatePage.yearDateInput('warrantDate').type('2023')
    warrantDatePage.continueButton().click()

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-case-outcome')
    const overallOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    overallOutcomePage.radioLabelContains('Imprisonment').click()
    overallOutcomePage.continueButton().click()
    const outcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPageSentencing)
    outcomeAppliedAllPage.radioLabelSelector('false').click()
    outcomeAppliedAllPage.continueButton().click()
  })

  it('displays Duplicate this offence on each custodial offence card when the feature flag is on', () => {
    cy.createSentencedOffenceAllFeaturesOn('A1234AB', '0', '0', '0', '1')
    Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')

    cy.task('stubSearchSentenceTypes', {
      convictionDate: '2023-05-12',
      offenceDate: '2023-05-10',
    })
    cy.createSentencedConcurrentOffenceAllFeaturesOn('A1234AB', '0', '0', '1', '2')
    const checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 2 offences')

    checkOffenceAnswersPage
      .custodialOffences()
      .find('.offence-card')
      .should('have.length', 2)
      .each(offenceCard => {
        const editHref = offenceCard.find('[data-qa^="edit-offence-link-"]').attr('href')

        cy.wrap(offenceCard)
          .find('[data-qa^="duplicate-offence-link-"]')
          .should('have.length', 1)
          .and('be.visible')
          .and('have.text', 'Duplicate this offence')
          .and('have.attr', 'href', editHref.replace('/load-edit-offence', '/duplicate-offence'))
      })
  })

  it('duplicates a custodial offence through the full review, validation, and save journey', () => {
    cy.createSentencedOffenceAllFeaturesOn('A1234AB', '0', '0', '0', '1')
    let checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')

    checkOffenceAnswersPage
      .custodialOffences()
      .find('[data-qa^="duplicate-offence-link-"]')
      .should('have.length', 1)
      .and('be.visible')
      .and('have.text', 'Duplicate this offence')
      .click()

    let addDuplicatedOffenceDetailsPage = Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage.editSummaryList().getSummaryList().should('include', {
      'Count number': 'Count 1',
      Offence: 'PS90037 An offence description',
      'Committed on': 'Enter committed on date',
      Outcome: 'Imprisonment',
      'Conviction date': '13/05/2023',
      'Sentence type': 'SDS (Standard Determinate Sentence)',
      'Sentence length': '4 years 5 months 0 weeks 0 days',
      'Consecutive or concurrent': 'Enter consecutive or concurrent',
    })
    addDuplicatedOffenceDetailsPage.editOffenceDateCta().should('be.visible')
    addDuplicatedOffenceDetailsPage.editSentenceServeTypeCta().should('be.visible')

    addDuplicatedOffenceDetailsPage.continueButton().click()
    addDuplicatedOffenceDetailsPage = Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage
      .errorSummary()
      .should('contain', 'You must enter whether this offence is consecutive or concurrent')
      .and('contain', 'You must enter a committed on date')

    addDuplicatedOffenceDetailsPage.editOffenceDateCta().click()
    const offenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceDatePage.dayDateInput('offenceStartDate').clear().type('13')
    offenceDatePage.monthDateInput('offenceStartDate').clear().type('5')
    offenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceDatePage.continueButton().click()

    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage.editOffenceDateLink().should('be.visible')

    addDuplicatedOffenceDetailsPage.editSentenceServeTypeCta().click()
    const sentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
    sentenceServeTypePage.radioLabelContains('Concurrent').click()
    sentenceServeTypePage.continueButton().click()

    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage.editSentenceServeTypeLink().should('be.visible')

    addDuplicatedOffenceDetailsPage.continueButton().click()
    checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 2 offences')
    checkOffenceAnswersPage
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
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '13/05/2023',
          'Consecutive or concurrent': 'Concurrent',
          'Conviction date': '13/05/2023',
          Outcome: 'Imprisonment',
          'Sentence length': '4 years 5 months 0 weeks 0 days',
          'Sentence type': 'SDS (Standard Determinate Sentence)',
        },
      ])
  })

  it('duplicates a non-custodial offence through the full review and save journey', () => {
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
    cy.task('stubHasSentencesAfterOnOtherCourtAppearance', {
      sentenceUuids: '([a-z0-9-]*,)*[a-z0-9-]*',
      hasSentenceAfterOnOtherCourtAppearance: false,
    })

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/0/add-another-offence')
    const initialOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    initialOffenceDatePage.dayDateInput('offenceStartDate').clear().type('12')
    initialOffenceDatePage.monthDateInput('offenceStartDate').clear().type('5')
    initialOffenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    initialOffenceDatePage.continueButton().click()

    const initialOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    initialOffenceCodePage.input().clear().type('PS90037')
    initialOffenceCodePage.continueButton().click()

    const initialOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    initialOffenceCodeConfirmPage.continueButton().click()

    const initialOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    initialOffenceOutcomePage.radioLabelContains('Lie on file').click()
    initialOffenceOutcomePage.continueButton().click()

    let checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')
    checkOffenceAnswersPage
      .nonCustodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '12/05/2023',
          Outcome: 'Lie on file',
        },
      ])

    checkOffenceAnswersPage
      .nonCustodialOffences()
      .find('[data-qa^="duplicate-offence-link-"]')
      .should('have.length', 1)
      .and('be.visible')
      .and('have.text', 'Duplicate this offence')
      .click()

    const addDuplicatedOffenceDetailsPage = Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage.editSummaryList().getSummaryList().should('deep.equal', {
      Offence: 'PS90037 An offence description',
      'Committed on': 'Enter committed on date',
      Outcome: 'Lie on file',
    })
    addDuplicatedOffenceDetailsPage.editOffenceDateCta().should('be.visible')

    addDuplicatedOffenceDetailsPage.backLink().click()
    checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 1 offence')
    checkOffenceAnswersPage.nonCustodialOffences().find('[data-qa^="duplicate-offence-link-"]').click()
    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)

    addDuplicatedOffenceDetailsPage.cancelButton().click()
    const cancelCourtCasePage = Page.verifyOnPageTitle(
      CourtCaseCancelCourtCasePage,
      'Are you sure you want to cancel adding a court case?',
    )
    cancelCourtCasePage.radioLabelSelector('false').click()
    cancelCourtCasePage.continueButton().click()
    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)

    addDuplicatedOffenceDetailsPage.editOffenceLink().click()
    const editOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
    editOffenceCodePage.input().clear().type('PS90037')
    editOffenceCodePage.continueButton().click()
    const confirmOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
    confirmOffenceCodePage.continueButton().click()
    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)

    addDuplicatedOffenceDetailsPage.editOutcomeLink().click()
    const editOffenceOutcomePage = Page.verifyOnPageTitle(
      OffenceOffenceOutcomePage,
      'Select the outcome for this offence',
    )
    editOffenceOutcomePage.radioLabelContains('Lie on file').click()
    editOffenceOutcomePage.continueButton().click()
    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)

    addDuplicatedOffenceDetailsPage.editOffenceDateCta().click()
    const offenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence date')
    offenceDatePage.dayDateInput('offenceStartDate').clear().type('13')
    offenceDatePage.monthDateInput('offenceStartDate').clear().type('5')
    offenceDatePage.yearDateInput('offenceStartDate').clear().type('2023')
    offenceDatePage.continueButton().click()

    Page.verifyOnPage(OffenceAddDuplicatedOffenceDetailsPage)
    addDuplicatedOffenceDetailsPage.editSummaryList().getSummaryList().should('deep.equal', {
      Offence: 'PS90037 An offence description',
      'Committed on': '13/05/2023',
      Outcome: 'Lie on file',
    })
    addDuplicatedOffenceDetailsPage.editOffenceDateLink().should('be.visible')

    addDuplicatedOffenceDetailsPage.continueButton().click()
    checkOffenceAnswersPage = Page.verifyOnPageTitle(OffenceCheckOffenceAnswersPage, 'You have added 2 offences')
    checkOffenceAnswersPage
      .nonCustodialOffences()
      .getOffenceCards()
      .should('deep.equal', [
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '12/05/2023',
          Outcome: 'Lie on file',
        },
        {
          offenceCardHeader: 'PS90037 An offence description',
          'Committed on': '13/05/2023',
          Outcome: 'Lie on file',
        },
      ])
  })
})
