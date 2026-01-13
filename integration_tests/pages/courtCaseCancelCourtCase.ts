import Page, { PageElement } from './page'

export default class CourtCaseCancelCourtCasePage extends Page {
  constructor(title: string) {
    super(title)
  }

  description = (): PageElement => cy.get('[data-qa=cancel-court-case-description]')
}
