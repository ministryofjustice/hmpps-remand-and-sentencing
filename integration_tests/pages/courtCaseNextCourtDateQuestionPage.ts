import Page, { PageElement } from './page'

export default class CourtCaseNextCourtDateQuestionPage extends Page {
  constructor() {
    super('Do you know the next court date?')
  }

  yesRadioButton = (): PageElement => cy.get(':radio[value="yes"]')
}
