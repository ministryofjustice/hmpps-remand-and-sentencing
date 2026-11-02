import Page, { PageElement } from './page'

export default class CannotReplaceAppealOffencePage extends Page {
  constructor() {
    super('The offence you are trying to replace is a part of a consecutive chain.')
  }

  offenceDetails = (): PageElement => cy.get('[data-qa="offenceDetails"]')
}
