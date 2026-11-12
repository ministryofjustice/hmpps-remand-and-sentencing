import Page, { PageElement } from './page'

export default class OffenceAddDuplicatedOffenceDetailsPage extends Page {
  constructor() {
    super('Add the details for this offence')
  }

  editOffenceDateCta = (): PageElement => cy.get('[data-qa="edit-offence-date-cta"]')

  editOffenceLink = (): PageElement => cy.get('a[data-qa^="edit-offence-code-"]')

  editOutcomeLink = (): PageElement => cy.get('a[data-qa^="edit-offence-outcome-"]')

  editOffenceDateLink = (): PageElement => cy.get('a[data-qa^="edit-offence-date-"]')

  editSummaryList = (): PageElement => cy.get('[data-qa="edit-summary-list"]')
}
