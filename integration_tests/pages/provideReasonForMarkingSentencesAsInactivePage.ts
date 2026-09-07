import Page, { PageElement } from './page'

export default class ProvideReasonForMarkingSentencesAsInactivePage extends Page {
  constructor(title: string) {
    super(title)
  }

  reasonTextarea = (): PageElement => cy.get('[data-qa=reason-textarea]')

  singleSentenceOffenceSummary = (): PageElement => cy.get('[data-qa=single-sentence-offence-summary]')

  hearingDetails = (): PageElement => cy.get('[data-qa=hearingDetails]')

  hearingDetailsOffences = (): PageElement => cy.get('.offences-summary-card-row')

  confirmAndSaveButton = (): PageElement => cy.get('[data-qa=confirm-and-save-button]')
}
