import Page, { PageElement } from './page'

export default class SentencingWarrantInformationCheckAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  confirmAndContinueButton = (): PageElement => cy.get('[data-qa=confirm-and-continue]')

  checkOverallAnswersSummaryList = (): PageElement => cy.get('[data-qa=check-overall-answers-summary-list]')
}
