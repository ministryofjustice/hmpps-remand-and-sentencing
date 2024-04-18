import Page, { PageElement } from './page'

export default class OffenceCheckOffenceAnswersPage extends Page {
  constructor(offenceCount: number, courtCaseReference: string, offenceSentence: string) {
    super(`You have added ${offenceCount} ${offenceSentence} to case ${courtCaseReference}`)
  }

  deleteOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    offenceId: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseId}/appearance/${appearanceReference}/offences/${offenceId}/delete-offence"]`,
    )

  finishAddingButton = (): PageElement => cy.get('[data-qa="finishAddingButton"]')

  infoBanner = (): PageElement => cy.get('.moj-banner')

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')
}
