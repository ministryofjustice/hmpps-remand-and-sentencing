import Page, { PageElement } from './page'

export default class CourtCaseCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  changeLink = (personId: string, courtCaseReference: string, appearanceReference: string, page: string): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseReference}/appearance/${appearanceReference}/${page}?submitToCheckAnswers=true"]`,
    )
}
