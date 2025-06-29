import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'

export default class DocumentManagementApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Document Management API', config.apis.documentManagementApi as ApiConfig, token)
  }

  async uploadWarrantDocument(
    prisonerId: string,
    documentId: string,
    file: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
  ): Promise<void> {
    return (await this.restClient.postMultiPart({
      path: `/documents/HMCTS_WARRANT/${documentId}`,
      fileToUpload: file,
      metadata: {
        prisonerId,
        state: 'IN_PROGRESS',
      },
      headers: {
        'Service-Name': 'Remand and Sentencing',
        Username: username,
        ...(activeCaseLoadId && { 'Active-Case-Load-Id': activeCaseLoadId }),
      },
    })) as void
  }

  async uploadDocument(
    prisonerId: string,
    documentId: string,
    file: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
    documentType: string,
  ): Promise<void> {
    try {
      await this.restClient.postMultiPart({
        path: `/documents/${documentType}/${documentId}`,
        fileToUpload: file,
        metadata: {
          prisonerId,
        },
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
          ...(activeCaseLoadId && { 'Active-Case-Load-Id': activeCaseLoadId }),
        },
      })
    } catch (error) {
      throw new Error(`Error in Document Management API: ${error.message}`)
    }
  }

  async deleteDocument(documentId: string, username: string, activeCaseLoadId: string): Promise<void> {
    try {
      await this.restClient.delete({
        path: `/documents/${documentId}`,
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
          'Active-Case-Load-Id': activeCaseLoadId,
        },
      })
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`)
    }
  }

  async downloadDocument(documentId: string, username: string, activeCaseLoadId: string): Promise<Buffer> {
    try {
      return await this.restClient.get({
        path: `/documents/${documentId}/file`,
        responseType: 'arraybuffer',
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
          ...(activeCaseLoadId && { 'Active-Case-Load-Id': activeCaseLoadId }),
        },
      })
    } catch (error) {
      throw new Error(`Error downloading document: ${error.message}`)
    }
  }
}
