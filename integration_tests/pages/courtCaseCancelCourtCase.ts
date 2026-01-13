import Page, { PageElement } from './page'

export default class CourtCaseCancelCourtCasePage extends Page {
  constructor() {
    super(`Are you sure you want to cancel adding a court case?`)
  }

  description = (): PageElement => cy.get('[data-qa=cancel-court-case-description]')
}
