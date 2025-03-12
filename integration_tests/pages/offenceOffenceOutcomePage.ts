import Page, { PageElement } from './page'

export default class OffenceOffenceOutcomePage extends Page {
  constructor(title: string) {
    super(title)
  }

  radios = (): PageElement => cy.get('.govuk-radios')
}
