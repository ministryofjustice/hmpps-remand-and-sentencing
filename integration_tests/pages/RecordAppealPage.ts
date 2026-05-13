import Page, { PageElement } from './page'

export default class RecordAppealPage extends Page {
  constructor() {
    super('Record appeal')
  }

  otherOffences = (): PageElement => cy.get('[data-qa="otherOffences"]')

  noWithAppealOutcomeInset = (): PageElement => cy.get('[data-qa="noWithAppealOutcomeInset"]')
}
