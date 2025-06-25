import Page from './page'

export default class DocumentUploadPage extends Page {
  constructor(documentType: string) {
    super(`Upload the ${documentType}`)
  }

  fileInput = () => cy.get('#document-upload')
}
