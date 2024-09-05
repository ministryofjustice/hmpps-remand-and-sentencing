import Page, { PageElement } from './page'

export default class CourtCaseCourtNamePage extends Page {
  constructor(title: string) {
    super(title)
  }

  firstAutoCompleteOption = (): PageElement => cy.get('[id="court-name__option--0"]')
}
