import Page, { PageElement } from './page'

export default class OffenceUpdateOutcomePage extends Page {
  constructor(title: string = 'What is the new outcome for this offence?') {
    super(title)
  }

  radios = (): PageElement => cy.get('.govuk-radios')

  offenceHint = (): PageElement => cy.get('[data-qa="offenceParagraph"]')
}
