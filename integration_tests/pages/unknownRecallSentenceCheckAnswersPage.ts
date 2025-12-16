import Page, { PageElement } from './page'

export default class UnknownRecallSentenceCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  offenceDateLink = (): PageElement => cy.get('[data-qa=edit-offence-date]')

  convictionDateLink = (): PageElement => cy.get('[data-qa=edit-conviction-date]')

  sentenceTypeLink = (): PageElement => cy.get('[data-qa=edit-sentence-type]')

  periodLengthLink = (type: string): PageElement => cy.get(`[data-qa=edit-period-length-${type}]`)

  answersSummaryList = (): PageElement => cy.get('[data-qa=answers-summary-list]')
}
