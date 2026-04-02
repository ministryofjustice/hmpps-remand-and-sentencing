import Page from '../../pages/page'
import AggravatingFactorsSelectOffenceWithAggravatedFactorsPage from '../../pages/aggravatingFactorsSelectOffenceWithAggravatedFactorsPage'
import SelectWhichAggravatingFactorsApplyPage from '../../pages/aggravatingFactorsSelectWhichAggravatingFactorsApplyPage'
import AggravatingFactorsCheckAnswersPage from '../../pages/aggravatingFactorsCheckAnswersPage'
import AggravatingFactorsDeleteAggravatingFactorPage from '../../pages/aggravatingFactorsDeleteAggravatingFactorPage'

context.skip('Delete aggravating factor', () => {
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
    cy.visit('/person/A1234AB/add-court-case/0/add-court-appearance/0/received-custodial-sentence')
    cy.task('stubHasLoopInChain')
    // use same flow as the selectWhich test to arrive at the check answers page
    cy.task('stubGetCourtsByIds')
    const selectOffenceWithAggravatingFactorsPage = new AggravatingFactorsSelectOffenceWithAggravatedFactorsPage()
    // create offences and mark some as aggravated
    cy.createSentencedOffence('A1234AB', '0', '0', '0')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '1', '2')
    cy.createSentencedOffenceConsecutiveTo('A1234AB', '0', '0', '2', '3')
    cy.visit(
      '/person/A1234AB/add-court-case/0/add-court-appearance/0/aggravating-factors/select-offence-with-aggravated-factors',
    )
    selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(0).click()
    selectOffenceWithAggravatingFactorsPage.aggravatedOffenceCheckbox(1).click()
    selectOffenceWithAggravatingFactorsPage.continueButton().click()
    selectWhichAggravatingFactorsApplyPage = Page.verifyOnPage(SelectWhichAggravatingFactorsApplyPage)
    // select at least one factor for the first offence and continue until check answers
    selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    selectWhichAggravatingFactorsApplyPage.terrorRelatedCheckbox().click()
    selectWhichAggravatingFactorsApplyPage.continueButton().click()
    Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
  })

  it('can delete aggravating factors for an offence', () => {
    const checkPage = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
    checkPage
      .insetText()
      .trimTextContent()
      .then(original => {
        // find chargeUuid from the edit link and visit the delete page
        cy.get('[data-qa^="edit-aggravating-factor-link-"]')
          .first()
          .then($el => {
            const href = $el.attr('href')
            if (href) {
              const chargeMatch = href.match(/aggravating-factors\/([a-f0-9-]+)\/delete-aggravating-factor/)
              if (chargeMatch) {
                const chargeUuid = chargeMatch[1]
                cy.visit(
                  `/person/A1234AB/add-court-case/0/add-court-appearance/0/aggravating-factors/${chargeUuid}/delete-aggravating-factor`,
                )
                const deletePage = Page.verifyOnPage(AggravatingFactorsDeleteAggravatingFactorPage)
                deletePage.listItems().should('exist')
                deletePage.deleteButton().click()
                // after deletion should return to check answers and the inset count should be decreased
                const after = Page.verifyOnPage(AggravatingFactorsCheckAnswersPage)
                after.insetText().trimTextContent().should('not.equal', original)
              }
            }
          })
      })
  })
})
