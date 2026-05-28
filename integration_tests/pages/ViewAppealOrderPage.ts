import Page, { PageElement } from './page'

export default class UploadAppealOrderPage extends Page {
  constructor() {
    super('Upload the appeal order')
  }

  removeDocumentLink = (type: string): PageElement => cy.get(`[data-qa=remove-${type}-document-link]`)
}
