import Page, { PageElement } from './page'

export default class CourtCaseDeleteHearingPage extends Page {
  constructor() {
    super(`Are you sure you want to delete this hearing?`)
  }

  description = (): PageElement => cy.get('[data-qa=appearance-description]')

  lastAppearanceMessage = (): PageElement => cy.get('[data-qa=last-appearance-message]')
}
