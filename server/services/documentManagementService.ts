import crypto from 'crypto'
import fs from 'fs'
import type { FileDownload } from 'models'
import DocumentManagementApiClient from '../data/documentManagementApiClient'

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

  async downloadDocument(documentId: string, username: string): Promise<FileDownload> {
    return this.documentManagementApiClient.downloadDocument(documentId, username)
  }
}
