import Page, { PageElement } from './page'

export default class AdminSentenceTypePage extends Page {
  constructor() {
    super('Sentence type admin')
  }

  editLink = (outcomeUuid: string): PageElement => cy.get(`[data-qa="edit-link-${outcomeUuid}"]`)
}
