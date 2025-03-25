import Page, { PageElement } from './page'

export default class OffenceUpdateOutcomePage extends Page {
  constructor() {
    super('What is the new outcome for this offence?')
  }

  radios = (): PageElement => cy.get('.govuk-radios')

  offenceParagraph = (): PageElement => cy.get('[data-qa=offenceParagraph]')
}
