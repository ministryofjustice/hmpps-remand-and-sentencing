import Page, { PageElement } from './page'

export default class UploadAppealOrderPage extends Page {
  constructor() {
    super('Upload the appeal order')
  }

  fileInput = (): PageElement => cy.get('#document-upload')
}
