import Page, { PageElement } from './page'

export default class CourtCaseCourtNamePage extends Page {
  constructor(title: string) {
    super(title)
  }

  firstAutoCompleteOption = (): PageElement => cy.get('ul[id="court-name__listbox"]:first')
}
