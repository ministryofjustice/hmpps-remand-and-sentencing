import Page, { PageElement } from './page'

export default class UpdateMissingSentenceInformationPage extends Page {
  constructor() {
    super('Update missing sentence information')
  }

  heading = (): PageElement => cy.get('h1')

  caption = (): PageElement => this.captionText()

  body = (): PageElement => this.bodyText()

  sentenceCount = (): PageElement => cy.get('h2.govuk-heading-m')

  appearanceHeading = (): PageElement => cy.get('h3.govuk-heading-s')

  offenceCard = (index: number): PageElement => cy.get(`[data-qa="offence-card-${index}"]`)

  updateSentenceLink = (index: number): PageElement => cy.get(`[data-qa="update-sentence-link-${index}"]`)
}
