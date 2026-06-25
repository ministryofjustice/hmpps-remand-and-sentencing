import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import AggravatingFactorsSelectOffenceWithAggravatedFactorsPage from '../../pages/aggravatingFactorsSelectOffenceWithAggravatedFactorsPage'
import SelectWhichAggravatingFactorsApplyPage from '../../pages/aggravatingFactorsSelectWhichAggravatingFactorsApplyPage'
import AggravatingFactorsCheckAnswersPage from '../../pages/aggravatingFactorsCheckAnswersPage'

context('Select which aggravating factors apply Page', () => {
  let selectWhichAggravatingFactorsApplyPage: SelectWhichAggravatingFactorsApplyPage
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
    cy.task('stubGetSentenceTypeById', {})
    cy.task('stubGetAllChargeOutcomes')
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
    cy.task('stubGetSentencesToChainTo', { beforeOrOnAppearanceDate: '2023-05-14' })
    cy.task('stubGetCourtsByIds')

    // ✅ NEW: stub aggravating factors list
    cy.task('stubGetAllAggravatingFactors')

    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    cy.task('stubHasLoopInChain')
    const receivedCustodialSentencePage = Page.verifyOnPage(ReceivedCustodialSentencePage)
    receivedCustodialSentencePage.radioLabelSelector('true').click()
    receivedCustodialSentencePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/warrant-date')
    const courtCaseWarrantDatePage = Page.verifyOnPageTitle(CourtCaseWarrantDatePage, 'warrant')
    courtCaseWarrantDatePage.dayDateInput('warrantDate').type('14')
    courtCaseWarrantDatePage.monthDateInput('warrantDate').type('5')
    courtCaseWarrantDatePage.yearDateInput('warrantDate').type('2023')
    courtCaseWarrantDatePage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/sentencing/overall-case-outcome')
    const overallOutcomePage = Page.verifyOnPageTitle(
      CourtCaseOverallCaseOutcomePage,
      'Select the overall case outcome',
    )
    overallOutcomePage.radioLabelContains('Imprisonment').click()
    overallOutcomePage.continueButton().click()
    const courtCaseCaseOutcomeAppliedAllPage = Page.verifyOnPage(CourtCaseCaseOutcomeAppliedAllPageSentencing)
    courtCaseCaseOutcomeAppliedAllPage.bodyText().trimTextContent().should('equal', 'Imprisonment')
    courtCaseCaseOutcomeAppliedAllPage.radioLabelSelector('false').click()
    courtCaseCaseOutcomeAppliedAllPage.continueButton().click()
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/offences/check-offence-answers')
    let offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 0 offence')
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1', '2')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3')
    offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/aggravating-factors/select-offence-with-aggravated-factors',
    )
    const selectOffenceWithAggravatingFactorsPage = new AggravatingFactorsSelectOffenceWithAggravatedFactorsPage()
    selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(0).click()
    selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(1).click()
    selectOffenceWithAggravatingFactorsPage.continueButton().click()
    selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
  })

  it('page should show error if none of the checkbox is selected', () => {
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    selectWhichAggravatingFactorsApplyPage
      .errorSummary()
      .trimTextContent()
      .should('equal', 'There is a problem Select at least one aggravating factor applicable to the offence')
  })

  it('once a aggravating factor is selected should move on to the next offence', () => {
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
  })

  it('once all aggravating factors are processed should move on to the check answers page', () => {
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OAFPC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
  })

  it('page should not show error during edit mode', () => {
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    const aggravatingFactorsCheckAnswersPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
    cy.get('[data-qa^="edit-aggravating-factor-link-"]').each($el => {
      const href = $el.attr('href')
      const match = href.match(/aggravating-factors\/([a-f0-9-]+)\//)
      if (match) {
        const chargeUuid = match[1]
        aggravatingFactorsCheckAnswersPage.editAggravatingFactorLink(chargeUuid).click()
        selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
        selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
        selectWhichAggravatingFactorsApplyPage.continueButton().click()
      }
    })
    Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
  })

  it('should allow selecting a non-boolean aggravating factor', () => {
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('RA').click()

    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
  })
})
