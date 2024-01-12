import crypto from 'crypto'
import fs from 'fs'
import DocumentManagementApiClient from '../api/documentManagementApiClient'
import { dataAccess } from '../data'

export default class DocumentManagementService {
  async uploadWarrant(
    prisonerId: string,
    fileToUpload: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
  ): Promise<string> {
    const documentId = crypto.randomUUID()
    const token = await dataAccess().hmppsAuthClient.getSystemClientToken(username)
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
