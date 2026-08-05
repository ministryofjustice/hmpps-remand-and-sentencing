import Page, { PageElement } from './page'

export default class AggravatingFactorsCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  finishAddingButton = (): PageElement => cy.get('[data-qa="finishAddingButton"]')

  finishedAddingRadio = (): PageElement => cy.get('[data-qa="finishAddingRadio"]')

  insetText = (): PageElement => cy.get('[data-qa="aggravatedFactorsInsetText"]')

  selectAnotherAggravatingFactor = (): PageElement => cy.get('[data-qa="selectAnotherAggravatingFactor"]')

  editAggravatingFactorLink = (chargeUuid: string): PageElement =>
    cy.get(`[data-qa="edit-aggravating-factor-link-${chargeUuid}"]`)

  deleteAggravatingFactorLink = (
    nomsId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    chargeUuid: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${nomsId}/${addOrEditCourtCase}/${courtCaseReference}/${addOrEditCourtAppearance}/${appearanceReference}/aggravating-factors/${chargeUuid}/delete-aggravating-factor"]`,
    )
}
