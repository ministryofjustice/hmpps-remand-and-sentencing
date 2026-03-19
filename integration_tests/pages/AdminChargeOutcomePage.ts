import Page, { PageElement } from './page'

export default class AdminChargeOutcomePage extends Page {
  constructor() {
    super('Charge outcome admin')
  }

  editLink = (outcomeUuid: string): PageElement => cy.get(`[data-qa="edit-link-${outcomeUuid}]`)
}
