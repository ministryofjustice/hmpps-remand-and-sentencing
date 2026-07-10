import Page, { PageElement } from './page'

export default class UploadBreachOrderPage extends Page {
  constructor() {
    super('Upload the breach order')
  }

  fileInput = (): PageElement => cy.get('#document-upload')
}
