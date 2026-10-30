import Page, { PageElement } from './page'

export default class ViewF986DocumentsPage extends Page {
  constructor() {
    super('Select which court cases apply')
  }

  viewButton = (): PageElement => cy.get('[data-qa=view-button]')

  radios = (): PageElement => cy.get('input[type=radio][name=documentSelected]')

  radioForDocument = (url: string): PageElement => cy.get(`input[name=documentSelected][value="${url}"]`)
}
