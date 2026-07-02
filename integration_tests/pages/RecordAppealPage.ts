import Page, { PageElement } from './page'

export default class RecordAppealPage extends Page {
  constructor() {
    super('Record appeal')
  }

  otherOffences = (): PageElement => cy.get('[data-qa="otherOffences"]')

  noWithAppealOutcomeInset = (): PageElement => cy.get('[data-qa="noWithAppealOutcomeInset"]')

  recordOffenceAppealLink = (chargeUuid: string): PageElement => cy.get(`[data-qa="record-appeal-link-${chargeUuid}"]`)

  updateAppealOutcomeLink = (chargeUuid: string): PageElement => cy.get(`[data-qa="update-outcome-link-${chargeUuid}"]`)

  appealedOffences = (): PageElement => cy.get('[data-qa="appealedOffences"]')
}
