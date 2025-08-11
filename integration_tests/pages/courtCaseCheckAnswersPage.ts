import Page, { PageElement } from './page'

export default class CourtCaseCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  editFieldLink = (
    personId: string,
    addOrEditCourtCase: string,
    courtCaseReference: string,
    addOrEditCourtAppearance: string,
    appearanceReference: string,
    page: string,
    submitToCheckAnsers: boolean = false,
  ): PageElement => {
    const queryParam = submitToCheckAnsers ? '?submitToCheckAnswers=true' : ''
    const href = `/person/${personId}/${addOrEditCourtCase}-court-case/${courtCaseReference}/${addOrEditCourtAppearance}-court-appearance/${appearanceReference}/${page}${queryParam}`
    return cy.get(`a[href="${href}"]`)
  }

  editWarrantDateLink = (): PageElement => cy.get('[data-qa=edit-warrant-date-link]')
}
