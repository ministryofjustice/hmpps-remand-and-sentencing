import Page, { PageElement } from './page'

export default class OffenceCheckOffenceAnswersPage extends Page {
  constructor(title: string) {
    super(title)
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

  finishedAddingRadio = (): PageElement => cy.get('[data-qa="finishAddingRadio"]')

  notFinishedRadio = (): PageElement => cy.get('[data-qa="notFinishedRadio"]')

  addAnotherButton = (): PageElement => cy.get('[data-qa="addAnotherOffence"]')

  overallSentenceLength = (): PageElement => cy.get('[data-qa="overallSentenceLengthComparison"] > :nth-child(1)')

  sentencesAdded = (): PageElement => cy.get('[data-qa="overallSentenceLengthComparison"] > :nth-child(2)')

  offencesSummaryCard = (): PageElement => cy.get('[data-qa="offences-summary-card"]')

  custodialOffences = (): PageElement => cy.get('[data-qa="custodialOffences"]')

  nonCustodialOffences = (): PageElement => cy.get('[data-qa="nonCustodialOffences"]')

  noNonCustodialOutcomeInset = (): PageElement => cy.get('[data-qa="noNonCustodialOutcomeInset"]')

  noCustodialOutcomeInset = (): PageElement => cy.get('[data-qa="noCustodialOutcomeInset"]')

  countWarning = (): PageElement => cy.get('[data-qa="countWarning"]')
}
