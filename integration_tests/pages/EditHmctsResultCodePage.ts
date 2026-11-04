import Page, { PageElement } from './page'

export default class EditHmctsResultCode extends Page {
  constructor() {
    super('Edit HMCTS Result Code')
  }

  resultNameInput = (): PageElement => cy.get('#resultName')

  resultCodeInput = (): PageElement => cy.get('#resultCode')

  outcomeUuidInput = (): PageElement => cy.get('#outcomeUuid')

  statusInput = (): PageElement => cy.get('#status')
}
