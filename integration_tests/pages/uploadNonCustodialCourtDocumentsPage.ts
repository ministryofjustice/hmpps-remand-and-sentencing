import Page, { PageElement } from './page'

export default class UploadNonCustodialCourtDocumentsPage extends Page {
  constructor() {
    super('Upload court documents')
  }

  removeDocumentLink = (type: string): PageElement => cy.get(`[data-qa=remove-${type}-document-link]`)

  uploadLinks = (): PageElement => cy.get('[data-qa^=upload-document-link]')

  uploadDocumentLink = (type: string): PageElement => cy.get(`[data-qa=upload-document-link-${type}]`)
}
