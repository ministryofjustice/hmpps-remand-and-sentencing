import RestClient from '../data/restClient'
import config, { ApiConfig } from '../config'

export default class DocumentManagementApiClient {
  restClient: RestClient

  constructor(token: string) {
    this.restClient = new RestClient('Document Management API', config.apis.documentManagementApi as ApiConfig, token)
  }

  async uploadWarrantDocument(prisonerId: string, documentId: string, file: Express.Multer.File): Promise<void> {
    return (await this.restClient.postMultiPart({
      path: `/documents/HMCTS_WARRANT/${documentId}`,
      fileToUpload: file,
      metadata: {
        prisonerId,
        state: 'IN_PROGRESS',
      },
    })) as void
  }
}
