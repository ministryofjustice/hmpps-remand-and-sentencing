import Page, { PageElement } from './page'

export default class AppealCourtNamePage extends Page {
  constructor() {
    super('Which court heard the appeal?')
  }

  firstAutoCompleteOption = (): PageElement => cy.get('#court-name__option--0')
}
