import Page, { PageElement } from './page'

export default class CourtCaseReferencePage extends Page {
  constructor(title: string) {
    super(title)
  }

  noCaseReferenceCheckbox = (): PageElement => cy.get('[data-qa=noCaseReference]')
}
