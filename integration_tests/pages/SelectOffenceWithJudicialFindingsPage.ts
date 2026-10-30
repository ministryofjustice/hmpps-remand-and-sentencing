import Page, { PageElement } from './page'

export default class SelectOffenceWithJudicialFindingsPage extends Page {
  constructor() {
    super('Select the offences with judicial findings')
  }

  checkboxes = (): PageElement => cy.get('.govuk-checkboxes')

  checkbox = (index: number): PageElement => cy.get(`[data-qa=checkbox-${index}]`)
}
