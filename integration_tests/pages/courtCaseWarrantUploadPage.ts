import Page, { PageElement } from './page'

export default class CourtCaseWarrantUploadPage extends Page {
  constructor() {
    super('Upload a warrant')
  }

  fileInput = (): PageElement => cy.get('.govuk-file-upload')
}
