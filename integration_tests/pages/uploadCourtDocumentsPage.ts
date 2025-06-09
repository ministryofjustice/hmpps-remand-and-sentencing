import Page, { PageElement } from './page'

export default class UploadCourtDocumentsPage extends Page {
  constructor() {
    super('Upload court documents')
  }

  subtText = (): PageElement => cy.get('.govuk-body-l')
}
