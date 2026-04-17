import Page from '../../pages/page'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'
import SelectWhichAggravatingFactorsApplyPage from '../../pages/aggravatingFactorsSelectWhichAggravatingFactorsApplyPage'
import AggravatingFactorsCheckAnswersPage from '../../pages/aggravatingFactorsCheckAnswersPage'
import AggravatingFactorsSelectOffenceWithAggravatedFactorsPage from '../../pages/aggravatingFactorsSelectOffenceWithAggravatedFactorsPage'
import CourtCaseTaskListPage from '../../pages/courtCaseTaskListPage'

context('Check aggravating factors answers Page', () => {
  let checkAnswersPage: AggravatingFactorsCheckAnswersPage
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
    // ensure the base offence has a count of 1 so the UI shows "Count 1"
    cy.createSentencedOffence('A1234AB', '0', '0', '0', '1')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1', '2')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 2 offence')
    offenceCheckOffenceAnswersPage.finishedAddingRadio().click()
    offenceCheckOffenceAnswersPage.finishAddingButton().click()
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/aggravating-factors/select-offence-with-aggravated-factors',
    )
  })
  context('when selecting all offences', () => {
    beforeEach('', () => {
      const selectOffenceWithAggravatingFactorsPage = new AggravatingFactorsSelectOffenceWithAggravatedFactorsPage()
      selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(0).click()
      selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(1).click()
      selectOffenceWithAggravatingFactorsPage.continueButton().click()
      const selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
      selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
      selectWhichAggravatingFactorsApplyPage.foreignPowerRelatedCheckbox().click()
      selectWhichAggravatingFactorsApplyPage.continueButton().click()
      Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
      selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
      selectWhichAggravatingFactorsApplyPage.continueButton().click()
      checkAnswersPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
    })
    it('page should show error if clicked on continue without selecting option', () => {
      checkAnswersPage.finishAddingButton().click()
      checkAnswersPage
        .errorSummary()
        .trimTextContent()
        .should('equal', 'There is a problem Select if you have finished adding the aggravating factors')
    })

    it('should show offence with aggravated factors count correctly', () => {
      checkAnswersPage.insetText().should('contain', 'There are 2 sentences with aggravating factors.')
    })

    it('should go to tasklist page once radio option is chosen', () => {
      checkAnswersPage.finishedAddingRadio().click()
      checkAnswersPage.finishAddingButton().click()
      Page.verifyOnPageTitle(CourtCaseTaskListPage, 'Add a court case')
    })

    it('select another aggravating factor button should be inactive', () => {
      checkAnswersPage.selectAnotherAggravatingFactor().should('be.disabled')
    })

    it('goes to aggravated factors page with pre chosen values marked when edit link is clicked', () => {
      // there should be two edit links (one per aggravated offence)
      cy.get('[data-qa^="edit-aggravating-factor-link-"]').should('have.length', 2)

      // Edit the first aggravated offence and assert the previously selected values are checked
      cy.get('[data-qa^="edit-aggravating-factor-link-"]').eq(0).click()
      const selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
      selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().should('be.checked')
      selectWhichAggravatingFactorsApplyPage.foreignPowerRelatedCheckbox().should('be.checked')
      // continue back to the check answers page
      selectWhichAggravatingFactorsApplyPage.continueButton().click()
      Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
    })

    it('changes made during update should show up on check answers page', () => {
      // Edit the first aggravated offence: remove the 'terrorRelated' factor and save
      cy.get('[data-qa^="edit-aggravating-factor-link-"]')
        .first()
        .then($el => {
          const href = $el.attr('href')
          const match = href.match(/aggravating-factors\/([a-f0-9-]+)\//)
          if (match) {
            const chargeUuid = match[1]
            const aggravatingFactorsCheckOffenceAnswersPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
            aggravatingFactorsCheckOffenceAnswersPage.editAggravatingFactorLink(chargeUuid).click()
            const selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)

            // sanity: first offence should have both checked initially (as per setup)
            selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().should('be.checked')
            selectWhichAggravatingFactorsApplyPage.foreignPowerRelatedCheckbox().should('be.checked')

            // change: uncheck terror related, keep foreign power checked
            selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
            selectWhichAggravatingFactorsApplyPage.continueButton().click()

            // Back on check answers page — verify the change persisted by re-opening the first edit link
            Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
          }
        })

      cy.get('[data-qa^="edit-aggravating-factor-link-"]')
        .first()
        .then($el => {
          const href = $el.attr('href')
          const match = href.match(/aggravating-factors\/([a-f0-9-]+)\//)
          if (match) {
            const chargeUuid = match[1]
            const aggravatingFactorsCheckOffenceAnswersPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
            aggravatingFactorsCheckOffenceAnswersPage.editAggravatingFactorLink(chargeUuid).click()
            const selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)

            // sanity: first offence should have both checked initially (as per setup)
            selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().should('not.be.checked')
            selectWhichAggravatingFactorsApplyPage.foreignPowerRelatedCheckbox().should('be.checked')
          }
        })
    })
  })

  context('when not selecting all offences', () => {
    it('should direct to choose aggravating factor page on button press and show correct number of options', () => {
      const selectOffenceWithAggravatingFactorsPage = new AggravatingFactorsSelectOffenceWithAggravatedFactorsPage()
      selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(0).click()
      selectOffenceWithAggravatingFactorsPage.continueButton().click()
      const selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
      selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
      selectWhichAggravatingFactorsApplyPage.foreignPowerRelatedCheckbox().click()
      selectWhichAggravatingFactorsApplyPage.continueButton().click()
      checkAnswersPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
      checkAnswersPage.selectAnotherAggravatingFactor().click()
      selectOffenceWithAggravatingFactorsPage.assertAggravatedOffenceCheckboxesCount(1)
      selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(0).should('exist')
    })
  })
})
