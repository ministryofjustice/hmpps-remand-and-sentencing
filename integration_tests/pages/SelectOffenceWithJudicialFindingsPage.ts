import Page, { PageElement } from './page'

export default class SelectOffenceWithJudicialFindingsPage extends Page {
  constructor() {
    super('Select the offences with judicial findings')
  }

  checkboxes = (): PageElement => cy.get('.govuk-checkboxes')
}
