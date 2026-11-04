import Page, { PageElement } from './page'

export default class AdminHmctsResultCodePage extends Page {
  constructor() {
    super('HMCTS result code admin')
  }

  editLink = (resultUuid: string): PageElement => cy.get(`[data-qa="edit-link-${resultUuid}"]`)
}
