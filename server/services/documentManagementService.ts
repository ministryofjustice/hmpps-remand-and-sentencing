import crypto from 'crypto'
import fs from 'fs'
import DocumentManagementApiClient from '../api/documentManagementApiClient'

export default class DocumentManagementService {
  async uploadWarrant(prisonerId: string, token: string, fileToUpload: Express.Multer.File): Promise<string> {
    const documentId = crypto.randomUUID()
    await new DocumentManagementApiClient(token).uploadWarrantDocument(prisonerId, documentId, fileToUpload)
    fs.unlinkSync(fileToUpload.path)
    return documentId
  }
}
