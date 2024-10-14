import Page, { PageElement } from './page'

export default class CourtCaseOverallCaseOutcomePage extends Page {
  constructor(title: string) {
    super(title)
  }

  legendParagraph = (): PageElement => cy.get('[data-qa=legendParagraph]')
}
