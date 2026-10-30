import Page, { PageElement } from './page'

export default class SelectSentencesToMarkAsInactivePage extends Page {
  constructor() {
    super('Select the sentences to mark as inactive')
  }

  hearingDetails = (): PageElement => cy.get('[data-qa=hearingDetails]')
}
