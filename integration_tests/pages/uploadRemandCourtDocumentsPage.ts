import Page, { PageElement } from './page'

export default class UploadRemandCourtDocumentsPage extends Page {
  constructor() {
    super('Upload court documents')
  }

  removeDocumentLink = (type: string): PageElement => cy.get(`[data-qa=remove-${type}-document-link]`)

  documentLink = (fileName: string): PageElement => cy.get(`a:contains("${fileName}")`)

  commonPlatformTag = (fileName: string): PageElement =>
    this.documentLink(fileName).parents('.govuk-summary-list__row').find('.govuk-tag:contains("Common platform")')
}
