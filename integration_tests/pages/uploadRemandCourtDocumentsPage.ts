import Page, { PageElement } from './page'

export default class UploadRemandCourtDocumentsPage extends Page {
  constructor() {
    super('Upload court documents')
  }

  deleteDocumentButton = (): PageElement => cy.get('[data-qa=delete-document-button]')
}
