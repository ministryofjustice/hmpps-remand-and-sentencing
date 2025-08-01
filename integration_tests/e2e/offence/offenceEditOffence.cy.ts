import CourtCaseAppearanceDetailsPage from '../../pages/courtCaseAppearanceDetailsPage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseWarrantTypePage from '../../pages/courtCaseWarrantTypePage'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import OffenceCountNumberPage from '../../pages/offenceCountNumberPage'
import OffenceEditOffencePage from '../../pages/offenceEditOffencePage'
import OffenceOffenceCodeConfirmPage from '../../pages/offenceOffenceCodeConfirmPage'
import OffenceOffenceCodePage from '../../pages/offenceOffenceCodePage'
import OffenceOffenceDatePage from '../../pages/offenceOffenceDatePage'
import OffencePeriodLengthPage from '../../pages/offencePeriodLengthPage'
import OffenceSentenceServeTypePage from '../../pages/offenceSentenceServeTypePage'
import OffenceSentenceTypePage from '../../pages/offenceSentenceTypePage'
import SentenceSentenceConsecutiveToPage from '../../pages/sentenceSentenceConsecutiveToPage'
import Page from '../../pages/page'
import OffenceConvictionDatePage from '../../pages/offenceConvictionDatePage'
import StartPage from '../../pages/startPage'
import CourtCaseOverallSentenceLengthPage from '../../pages/courtCaseOverallSentenceLengthPage'
import OffenceUpdateOffenceOutcomesPage from '../../pages/offenceUpdateOffenceOutcomesPage'
import OffenceOffenceOutcomePage from '../../pages/offenceOffenceOutcomePage'
import SentenceIsSentenceConsecutiveToPage from '../../pages/sentenceIsSentenceConsecutiveToPage'
import OffenceFineAmountPage from '../../pages/offenceFineAmountPage'

context('Add Offence Edit offence Page', () => {
  let offenceEditOffencePage: OffenceEditOffencePage
  beforeEach(() => {
    cy.task('happyPathStubs')
    cy.task('stubGetOffenceByCode', {})
    cy.task('stubGetOffencesByCodes', {})
    cy.task('stubGetAllChargeOutcomes')
    cy.signIn()
  })

  context('remand', () => {
    beforeEach(() => {
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {})
      cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-type')
      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('REMAND').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.createOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    })

    it('can edit offence date and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'offence-date').click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').should('have.value', '15')
      offenceOffenceDatePage.monthDateInput('offenceStartDate').should('have.value', '7')
      offenceOffenceDatePage.yearDateInput('offenceStartDate').should('have.value', '2023')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('1')
      offenceOffenceDatePage.dayDateInput('offenceEndDate').clear().type('25')
      offenceOffenceDatePage.monthDateInput('offenceEndDate').clear().type('7')
      offenceOffenceDatePage.yearDateInput('offenceEndDate').clear().type('2023')
      offenceOffenceDatePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': '01/07/2023 to 25/07/2023',
        Outcome: 'Remanded in custody',
      })
    })

    it('can edit offence and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'offence-code').click()
      cy.task('stubGetOffenceByCode', { offenceCode: 'AB11000', offenceDescription: 'Another offence description' })
      cy.task('stubGetOffencesByCodes', { offenceCode: 'AB11000', offenceDescription: 'Another offence description' })
      const offenceOffenceCodePage = Page.verifyOnPage(OffenceOffenceCodePage)
      offenceOffenceCodePage.input().should('have.value', 'PS90037')
      offenceOffenceCodePage.input().clear().type('AB11000')
      offenceOffenceCodePage.continueButton().click()

      const offenceOffenceCodeConfirmPage = Page.verifyOnPage(OffenceOffenceCodeConfirmPage)
      offenceOffenceCodeConfirmPage.continueButton().click()

      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        Offence: 'AB11000 Another offence description',
        'Committed on': '15/07/2023',
        Outcome: 'Remanded in custody',
      })
    })
  })

  context('sentence', () => {
    beforeEach(() => {
      cy.task('stubGetSentenceTypeById', {})
      cy.task('stubGetSentenceTypesByIds', [
        {
          sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
          description: 'SDS (Standard Determinate Sentence)',
          classification: 'STANDARD',
        },
      ])
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
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()
      cy.createSentencedOffence('A1234AB', '0', '0', '0')
      const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 1 offence')
      offenceCheckOffenceAnswersPage.editOffenceLink('A1234AB', '0', '0', '0').click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    })

    it('can edit count number and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'count-number').click()
      const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
      offenceCountNumberPage.radioLabelSelector('true').click()
      offenceCountNumberPage.input().should('have.value', '1')
      offenceCountNumberPage.input().clear().type('5')
      offenceCountNumberPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 5',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit sentence length and return to edit page', () => {
      offenceEditOffencePage.editPeriodLengthLink('A1234AB', 'add', '0', '0', '0', 'SENTENCE_LENGTH').click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage.yearsInput().should('have.value', '4')
      offencePeriodLengthPage.yearsInput().clear().type('6')
      offencePeriodLengthPage.monthsInput().should('have.value', '5')
      offencePeriodLengthPage.monthsInput().clear().type('6')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '6 years 6 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit sentence serve type and return to edit page', () => {
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'sentence-serve-type').click()
      const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
      offenceSentenceServeTypePage.radioSelector('FORTHWITH').should('be.checked')
      offenceSentenceServeTypePage.radioLabelSelector('CONCURRENT').click()
      offenceSentenceServeTypePage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Concurrent',
      })
    })

    it('can edit sentence type and return to edit page', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
        description: 'EDS (Extended Determinate Sentence)',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'sentence-type').click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').should('be.checked')
      offenceSentenceTypePage.radioLabelContains('EDS (Extended Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()
      let offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().type('4')
      offencePeriodLengthPage.monthsInput().type('4')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'licence period')
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.monthsInput().type('2')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '4 years 4 months 0 weeks 0 days',
        'Licence period': '2 years 2 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('can edit consecutive to and return to edit page', () => {
      cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-05-13' })
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetConsecutiveToDetails', { sentenceUuids: ['328fa693-3f99-46bf-9a94-d8578dc399af'] })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'sentence-serve-type').click()
      const offenceSentenceServeTypePage = Page.verifyOnPage(OffenceSentenceServeTypePage)
      offenceSentenceServeTypePage.radioSelector('FORTHWITH').should('be.checked')
      offenceSentenceServeTypePage.radioLabelSelector('CONSECUTIVE').click()
      offenceSentenceServeTypePage.continueButton().click()
      const sentenceSentenceConsecutiveToPage = Page.verifyOnPage(SentenceSentenceConsecutiveToPage)
      sentenceSentenceConsecutiveToPage.radioSelector('328fa693-3f99-46bf-9a94-d8578dc399af|OTHER').click()
      sentenceSentenceConsecutiveToPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent':
          'Consecutive to count 1 on case X34345 at Southampton Magistrate Court on 23/02/2023',
      })
    })

    it('editing offence date and invalidating means entering conviction date, sentence type and period lengths again', () => {
      cy.task('stubIsSentenceTypeStillValid', {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        isStillValid: false,
      })
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
        description: 'EDS (Extended Determinate Sentence)',
      })
      cy.task('stubSearchSentenceTypes', {
        convictionDate: '2023-05-13',
        offenceDate: '2023-05-08',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'offence-date').click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').should('have.value', '12').clear().type('8')
      offenceOffenceDatePage.continueButton().click()
      const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
      offenceConvictionDatePage.dayDateInput('convictionDate').type('13')
      offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
      offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
      offenceConvictionDatePage.continueButton().click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('EDS (Extended Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()
      let offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().type('4')
      offencePeriodLengthPage.monthsInput().type('4')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'licence period')
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.monthsInput().type('2')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '08/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '4 years 4 months 0 weeks 0 days',
        'Licence period': '2 years 2 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('editing conviction date and invalidating means entering sentence type and period lengths again', () => {
      cy.task('stubIsSentenceTypeStillValid', {
        sentenceTypeUuid: '467e2fa8-fce1-41a4-8110-b378c727eed3',
        isStillValid: false,
      })
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'bc929dc9-019c-4acc-8fd9-9f9682ebbd72',
        description: 'EDS (Extended Determinate Sentence)',
      })
      cy.task('stubSearchSentenceTypes', {
        convictionDate: '2023-05-13',
        offenceDate: '2023-05-12',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'offence-date').click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('12')
      offenceOffenceDatePage.continueButton().click()
      const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
      offenceConvictionDatePage.dayDateInput('convictionDate').clear().type('13')
      offenceConvictionDatePage.monthDateInput('convictionDate').clear().type('5')
      offenceConvictionDatePage.yearDateInput('convictionDate').clear().type('2023')
      offenceConvictionDatePage.continueButton().click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioSelector('467e2fa8-fce1-41a4-8110-b378c727eed3|STANDARD').should('not.be.checked')
      offenceSentenceTypePage.radioLabelContains('EDS (Extended Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()
      let offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'custodial term')
      offencePeriodLengthPage.yearsInput().type('4')
      offencePeriodLengthPage.monthsInput().type('4')
      offencePeriodLengthPage.continueButton().click()
      offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'licence period')
      offencePeriodLengthPage.yearsInput().type('2')
      offencePeriodLengthPage.monthsInput().type('2')
      offencePeriodLengthPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'EDS (Extended Determinate Sentence)',
        'Custodial term': '4 years 4 months 0 weeks 0 days',
        'Licence period': '2 years 2 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })

    it('shows fine amount when entered', () => {
      cy.task('stubGetSentenceTypeById', {
        sentenceTypeUuid: 'c71ceefe-932b-4a69-b87c-7c1294e37cf7',
        description: 'Imprisonment in Default of Fine',
        classification: 'FINE',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'sentence-type').click()
      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('Imprisonment in Default of Fine').click()
      offenceSentenceTypePage.continueButton().click()
      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'term length')
      offencePeriodLengthPage.yearsInput().type('5')
      offencePeriodLengthPage.continueButton().click()
      const offenceFineAmountPage = Page.verifyOnPage(OffenceFineAmountPage)
      offenceFineAmountPage.input().type('500')
      offenceFineAmountPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Count number': 'Count 1',
        'Conviction date': '13/05/2023',
        'Sentence type': 'Imprisonment in Default of Fine',
        'Fine Amount': '£500',
        'Term length': '5 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
      offenceEditOffencePage.editFieldLink('A1234AB', 'add', '0', 'add', '0', '0', 'fine-amount').click()
      Page.verifyOnPage(OffenceFineAmountPage)
      offenceFineAmountPage.input().should('have.value', '500')
      offenceFineAmountPage.input().clear()
      offenceFineAmountPage.input().type('200')
      offenceFineAmountPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Count number': 'Count 1',
        'Conviction date': '13/05/2023',
        'Sentence type': 'Imprisonment in Default of Fine',
        'Fine Amount': '£200',
        'Term length': '5 years 0 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })
  })

  context('edit', () => {
    let courtCaseAppearanceDetailsPage: CourtCaseAppearanceDetailsPage
    beforeEach(() => {
      cy.task('stubGetRemandNomisAppearanceDetails')
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {
        courtId: 'STHHPM',
        courtName: 'Southampton Magistrate Court',
      })
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.task('stubGetAppearanceOutcomeById', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Imprisonment',
          outcomeType: 'SENTENCING',
        },
      ])
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetAppearanceTypeByUuid')
      cy.task('stubGetChargeOutcomeById', {})
      cy.visit(
        '/person/A1234AB/edit-court-case/83517113-5c14-4628-9133-1e3cb12e31fa/edit-court-appearance/3fa85f64-5717-4562-b3fc-2c963f66afa6/sentencing/appearance-details',
      )
      courtCaseAppearanceDetailsPage = Page.verifyOnPageTitle(CourtCaseAppearanceDetailsPage, 'Edit appearance')
      courtCaseAppearanceDetailsPage
        .editOffenceLink('A1234AB', '83517113-5c14-4628-9133-1e3cb12e31fa', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '0')
        .click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    })

    it('show fields as not entered when null', () => {
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Committed on': 'Not entered',
        Offence: 'PS90037 An offence description',
        Outcome: 'Remanded in custody',
      })
    })
  })
  context('remand to sentencing', () => {
    beforeEach(() => {
      cy.task('stubSearchCourtCases', {})
      cy.task('stubGetCourtsByIds')
      cy.task('stubGetCourtById', {})
      cy.task('stubGetLatestCourtAppearance', {})
      cy.task('stubGetOffencesByCodes', {})
      cy.task('stubGetCountNumbersForCourtCase', {})
      cy.task('stubGetChargeOutcomesByIds', [
        {
          outcomeUuid: '85ffc6bf-6a2c-4f2b-8db8-5b466b602537',
          outcomeName: 'Remanded in custody',
          outcomeType: 'REMAND',
        },
      ])
      cy.task('stubGetLatestOffenceDate', {})
      cy.task('stubSearchSentenceTypes', {
        convictionDate: '2023-05-13',
        offenceDate: '2023-05-12',
      })
      cy.visit('/person/A1234AB')
      const startPage = Page.verifyOnPage(StartPage)
      startPage.addAppearanceLink('3fa85f64-5717-4562-b3fc-2c963f66afa6', '2').click()

      const courtCaseWarrantTypePage = Page.verifyOnPage(CourtCaseWarrantTypePage)
      courtCaseWarrantTypePage.radioLabelSelector('SENTENCING').click()
      courtCaseWarrantTypePage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/warrant-date',
      )
      const courtCaseWarrantDatePage = Page.verifyOnPage(CourtCaseWarrantDatePage)
      courtCaseWarrantDatePage.dayDateInput('warrantDate').type('13')
      courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
      courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
      courtCaseWarrantDatePage.continueButton().click()

      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/sentencing/overall-sentence-length',
      )
      const courtCaseOverallSentenceLengthPage = Page.verifyOnPage(CourtCaseOverallSentenceLengthPage)
      courtCaseOverallSentenceLengthPage.radioLabelSelector('true').click()
      courtCaseOverallSentenceLengthPage.yearsInput().type('4')
      courtCaseOverallSentenceLengthPage.monthsInput().type('5')
      courtCaseOverallSentenceLengthPage.weeksInput().type('3')
      courtCaseOverallSentenceLengthPage.daysInput().type('2')
      courtCaseOverallSentenceLengthPage.continueButton().click()
      cy.visit(
        '/person/A1234AB/edit-court-case/3fa85f64-5717-4562-b3fc-2c963f66afa6/add-court-appearance/2/update-offence-outcomes',
      )
      const offenceUpdateOffenceOutcomesPage = Page.verifyOnPage(OffenceUpdateOffenceOutcomesPage)
      cy.task('stubGetChargeOutcomeById', {})
      cy.task('stubGetOffenceByCode', {})
      cy.task('stubGetAllChargeOutcomes')
      cy.task('stubGetChargeOutcomeById', {
        outcomeUuid: '63920fee-e43a-45ff-a92d-4679f1af2527',
        outcomeName: 'Imprisonment',
        outcomeType: 'SENTENCING',
      })
      offenceUpdateOffenceOutcomesPage
        .editOffenceLink('A1234AB', '3fa85f64-5717-4562-b3fc-2c963f66afa6', '2', '0')
        .click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
    })

    it('editing outcome from remand to sentence leads to entering sentence information', () => {
      offenceEditOffencePage
        .editFieldLink('A1234AB', 'edit', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'add', '2', '0', 'offence-date')
        .click()
      const offenceOffenceDatePage = Page.verifyOnPageTitle(OffenceOffenceDatePage, 'Enter the offence dates')
      offenceOffenceDatePage.dayDateInput('offenceStartDate').clear().type('12')
      offenceOffenceDatePage.continueButton().click()
      offenceEditOffencePage
        .editFieldLink('A1234AB', 'edit', '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'add', '2', '0', 'offence-outcome')
        .click()
      const offenceOffenceOutcomePage = Page.verifyOnPageTitle(
        OffenceOffenceOutcomePage,
        'Select the outcome for this offence',
      )
      offenceOffenceOutcomePage.radioLabelContains('Imprisonment').click()
      offenceOffenceOutcomePage.continueButton().click()

      const offenceCountNumberPage = Page.verifyOnPage(OffenceCountNumberPage)
      offenceCountNumberPage.radioLabelSelector('true').click()
      offenceCountNumberPage.input().clear()
      offenceCountNumberPage.input().type('1')
      offenceCountNumberPage.continueButton().click()

      const offenceConvictionDatePage = Page.verifyOnPageTitle(OffenceConvictionDatePage, 'Enter the conviction date')
      offenceConvictionDatePage.dayDateInput('convictionDate').clear()
      offenceConvictionDatePage.dayDateInput('convictionDate').type('13')
      offenceConvictionDatePage.monthDateInput('convictionDate').clear()
      offenceConvictionDatePage.monthDateInput('convictionDate').type('5')
      offenceConvictionDatePage.yearDateInput('convictionDate').clear()
      offenceConvictionDatePage.yearDateInput('convictionDate').type('2023')
      offenceConvictionDatePage.continueButton().click()

      const offenceSentenceTypePage = Page.verifyOnPage(OffenceSentenceTypePage)
      offenceSentenceTypePage.radioLabelContains('SDS (Standard Determinate Sentence)').click()
      offenceSentenceTypePage.continueButton().click()

      const offencePeriodLengthPage = Page.verifyOnPageTitle(OffencePeriodLengthPage, 'sentence length')
      offencePeriodLengthPage.yearsInput().clear()
      offencePeriodLengthPage.yearsInput().type('4')
      offencePeriodLengthPage.monthsInput().clear()
      offencePeriodLengthPage.monthsInput().type('5')
      offencePeriodLengthPage.continueButton().click()

      const sentenceIsConsecutiveToPage = Page.verifyOnPage(SentenceIsSentenceConsecutiveToPage)
      sentenceIsConsecutiveToPage.radioLabelSelector('false').click()
      sentenceIsConsecutiveToPage.continueButton().click()
      offenceEditOffencePage = Page.verifyOnPageTitle(OffenceEditOffencePage, 'offence')
      offenceEditOffencePage.summaryList().getSummaryList().should('deep.equal', {
        'Count number': 'Count 1',
        Offence: 'PS90037 An offence description',
        'Committed on': '12/05/2023',
        Outcome: 'Imprisonment',
        'Conviction date': '13/05/2023',
        'Sentence type': 'SDS (Standard Determinate Sentence)',
        'Sentence length': '4 years 5 months 0 weeks 0 days',
        'Consecutive or concurrent': 'Forthwith',
      })
    })
  })
})
