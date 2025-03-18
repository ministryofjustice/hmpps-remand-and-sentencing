import Page, { PageElement } from './page'

export default class OffenceCheckOverallAnswersPage extends Page {
  constructor() {
    super('Check your answers')
  }

  confirmAndAddOffenceButton = (): PageElement => cy.get('[data-qa=confirm-and-add-offence]')

  checkOverallAnswersSummaryList = (): PageElement => cy.get('[data-qa=check-overall-answers-summary-list]')
}
