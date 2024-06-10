import Page, { PageElement } from './page'

export default class OffenceCheckOffenceAnswersPageEdit extends Page {
  constructor(offenceSentence: string) {
    super(`Edit the ${offenceSentence} details for this appearance`)
  }

  deleteOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    offenceId: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseId}/add-court-appearance/${appearanceReference}/offences/${offenceId}/delete-offence"]`,
    )

  editOffenceLink = (
    personId: string,
    courtCaseId: string,
    appearanceReference: string,
    offenceId: string,
  ): PageElement =>
    cy.get(
      `a[href="/person/${personId}/add-court-case/${courtCaseId}/add-court-appearance/${appearanceReference}/offences/${offenceId}/edit-offence"]`,
    )

  finishAddingButton = (): PageElement => cy.get('[data-qa="finishAddingButton"]')

  infoBanner = (): PageElement => cy.get('.moj-banner')

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')
}
