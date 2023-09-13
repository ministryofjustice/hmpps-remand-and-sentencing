import Page, { PageElement } from './page'

export default class StartPage extends Page {
  constructor(prisonerName: string) {
    super(`${prisonerName}'s court cases`)
  }

  ticketPanel = (): PageElement => cy.get('.moj-ticket-panel')
}
