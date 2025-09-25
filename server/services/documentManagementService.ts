import crypto from 'crypto'
import fs from 'fs'
// eslint-disable-next-line import/no-unresolved
import { UploadedDocument } from 'models'
import DocumentManagementApiClient from '../data/documentManagementApiClient'
import { documentToUploadedDocument } from '../utils/mappingUtils'

export default class DocumentManagementService {
  constructor(private readonly documentManagementApiClient: DocumentManagementApiClient) {}

  async uploadDocument(
    prisonerId: string,
    fileToUpload: Express.Multer.File,
    username: string,
    documentType: string,
  ): Promise<string> {
    const documentId = crypto.randomUUID()

    try {
      await this.documentManagementApiClient.uploadDocument(
        prisonerId,
        documentId,
        fileToUpload,
        username,
        documentType,
      )
      fs.unlinkSync(fileToUpload.path)
      return documentId
    } catch (error) {
      throw new Error(`Failed to upload document: ${error.message}`)
    }
  }

  async deleteDocument(documentId: string, username: string): Promise<void> {
    try {
      await this.documentManagementApiClient.deleteDocument(documentId, username)
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`)
    }
  }

  async getDocument(documentId: string, username: string): Promise<UploadedDocument> {
    try {
      const document = await this.documentManagementApiClient.getDocument(documentId, username)
      return documentToUploadedDocument(document)
    } catch (error) {
      throw new Error(`Failed to get document: ${error.message}`)
    }
  }

  async downloadDocument(documentId: string, username: string): Promise<Buffer> {
    try {
      return await this.documentManagementApiClient.downloadDocument(documentId, username)
    } catch (error) {
      throw new Error(`Failed to download document: ${error.message}`)
    }
  }
}
