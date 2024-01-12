import crypto from 'crypto'
import fs from 'fs'
import DocumentManagementApiClient from '../api/documentManagementApiClient'

export default class DocumentManagementService {
  async uploadWarrant(
    prisonerId: string,
    token: string,
    fileToUpload: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
  ): Promise<string> {
    const documentId = crypto.randomUUID()
    // get system token
    // set correct expected headers
    await new DocumentManagementApiClient(token).uploadWarrantDocument(
      prisonerId,
      documentId,
      fileToUpload,
      username,
      activeCaseLoadId,
    )
    fs.unlinkSync(fileToUpload.path)
    return documentId
  }
}
