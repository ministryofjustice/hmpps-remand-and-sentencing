import Page, { PageElement } from './page'

export default class OffenceOffenceCodePage extends Page {
  constructor() {
    super('Enter the offence code')
  }

  unknownCodeCheckbox = (): PageElement => cy.get('#unknown-code')
}
