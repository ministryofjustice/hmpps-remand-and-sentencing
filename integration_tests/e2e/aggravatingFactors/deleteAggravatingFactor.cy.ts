import Page from '../../pages/page'
import AggravatingFactorsSelectOffenceWithAggravatedFactorsPage from '../../pages/aggravatingFactorsSelectOffenceWithAggravatedFactorsPage'
import SelectWhichAggravatingFactorsApplyPage from '../../pages/aggravatingFactorsSelectWhichAggravatingFactorsApplyPage'
import AggravatingFactorsCheckAnswersPage from '../../pages/aggravatingFactorsCheckAnswersPage'
import AggravatingFactorsDeleteAggravatingFactorPage from '../../pages/aggravatingFactorsDeleteAggravatingFactorPage'
import ReceivedCustodialSentencePage from '../../pages/receivedCustodialSentencePage'
import CourtCaseWarrantDatePage from '../../pages/courtCaseWarrantDatePage'
import CourtCaseOverallCaseOutcomePage from '../../pages/courtCaseOverallCaseOutcomePage'
import CourtCaseCaseOutcomeAppliedAllPageSentencing from '../../pages/courtCaseCaseOutcomeAppliedAllPageSentencing'
import OffenceCheckOffenceAnswersPage from '../../pages/offenceCheckOffenceAnswersPage'

context('Delete aggravating factor', () => {
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
    cy.task('stubGetAllAggravatingFactors')
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
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3')
    const offenceCheckOffenceAnswersPage = new OffenceCheckOffenceAnswersPage('You have added 3 offence')
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
    // select at least one factor for the first offence and continue until check answers
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    selectWhichAggravatingFactorsApplyPage.checkboxByValue('OATC').click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
  })

  it('can delete aggravating factors for an offence', () => {
    const checkPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)

    // there should be two offences with aggravating factors set up in the beforeEach
    cy.get('[data-qa^="edit-aggravating-factor-link-"]').should('have.length', 2)

    checkPage
      .insetText()
      .trimTextContent()
      .then(original => {
        // find chargeUuid from the edit link (its href points at select-which-aggravating-factors-apply)
        cy.get('[data-qa^="edit-aggravating-factor-link-"]')
          .first()
          .invoke('attr', 'href')
          .then(href => {
            const chargeMatch = href.match(/aggravating-factors\/([a-f0-9-]+)\//)
            if (!chargeMatch) {
              throw new Error(`Could not find chargeUuid in edit link href: ${href}`)
            }
            const chargeUuid = chargeMatch[1]

            // click the actual 'Delete' link on the check answers page, as a user would
            checkPage
              .deleteAggravatingFactorLink('A1234AB', 'add-court-case', '0', 'add-court-appearance', '0', chargeUuid)
              .click()

            const deletePage = Page.verifyOnPage(AggravatingFactorsDeleteAggravatingFactorPage)
            // the confirmation page should list the factors that are about to be deleted
            deletePage.listItems().find('li').should('have.length.greaterThan', 0)
            deletePage.deleteButton().click()

            // after deletion we should be back on check answers with this offence no longer listed
            const after = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
            after.insetText().trimTextContent().should('not.equal', original)
            after.insetText().should('contain', 'There is 1 sentence with aggravating factors.')
            cy.get(`[data-qa="edit-aggravating-factor-link-${chargeUuid}"]`).should('not.exist')
            cy.get('[data-qa^="edit-aggravating-factor-link-"]').should('have.length', 1)
          })
      })
  })
})
