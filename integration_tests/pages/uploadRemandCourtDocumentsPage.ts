import Page, { PageElement } from './page'

export default class UploadRemandCourtDocumentsPage extends Page {
  constructor() {
    super('Upload court documents')
  }

  removeDocumentLink = (type: string): PageElement => cy.get(`[data-qa=remove-${type}-document-link]`)
}
