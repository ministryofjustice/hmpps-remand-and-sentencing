import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import type { AuthenticationClient } from '@ministryofjustice/hmpps-auth-clients'
import type { FileDownload } from 'models'
import config from '../config'
import logger from '../../logger'

export default class DocumentManagementApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('Document Management API', config.apis.documentManagementApi, logger, authenticationClient)
  }

  async uploadDocument(
    prisonerId: string,
    documentId: string,
    file: Express.Multer.File,
    username: string,
    documentType: string,
  ): Promise<void> {
    try {
      await this.postMultiPart({
        path: `/documents/${documentType}/${documentId}`,
        fileToUpload: file,
        metadata: {
          prisonerId,
        },
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
        },
        username,
      })
    } catch (error) {
      throw new Error(`Error in Document Management API: ${error.message}`)
    }
  }

  async deleteDocument(documentId: string, username: string): Promise<void> {
    try {
      await this.delete(
        {
          path: `/documents/${documentId}`,
          headers: {
            'Service-Name': 'Remand and Sentencing',
            Username: username,
          },
        },
        asSystem(username),
      )
    } catch (error) {
      throw new Error(`Error deleting document: ${error.message}`)
    }
  }

  async downloadDocument(documentId: string, username: string): Promise<Buffer> {
    try {
      return await this.get(
        {
          path: `/documents/${documentId}/file`,
          responseType: 'arraybuffer',
          headers: {
            'Service-Name': 'Remand and Sentencing',
            Username: username,
          },
        },
        asSystem(username),
      )
    } catch (error) {
      throw new Error(`Error downloading document: ${error.message}`)
    }
  }

  async downloadRawDocument(documentId: string, username: string): Promise<FileDownload> {
    return this.get(
      {
        path: `/documents/${documentId}/file`,
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
        },
        responseType: 'blob',
        raw: true,
      },
      asSystem(username),
    )
  }

  async postMultiPart<Response = unknown>({
    path,
    query = {},
    headers = {},
    responseType = '',
    metadata = {},
    raw = false,
    retry = false,
    fileToUpload,
    username,
  }): Promise<Response> {
    return this.makeRestClientCall(asSystem(username), async ({ superagent, token, agent }) => {
      const result = await superagent
        .post(`${this.config.url}${path}`)
        .query(query)
        .attach('file', fileToUpload.path, { filename: fileToUpload.originalname, contentType: fileToUpload.mimetype })
        .field('metadata', JSON.stringify(metadata))
        .agent(agent)
        .retry(2, (err, res) => {
          if (retry === false) {
            return false
          }
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .auth(token, { type: 'bearer' })
        .set(headers)
        .responseType(responseType)
        .timeout(this.config.timeout)

      return (raw ? result : result.body) as Response
    })
  }
}
