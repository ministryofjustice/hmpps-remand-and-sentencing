import crypto from 'crypto'
import fs from 'fs'
import DocumentManagementApiClient from '../api/documentManagementApiClient'
import { HmppsAuthClient } from '../data'

export default class DocumentManagementService {
  constructor(private readonly hmppsAuthClient: HmppsAuthClient) {}

  async uploadWarrant(
    prisonerId: string,
    fileToUpload: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
  ): Promise<string> {
    const documentId = crypto.randomUUID()
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
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

  async uploadDocument(
    prisonerId: string,
    fileToUpload: Express.Multer.File,
    username: string,
    activeCaseLoadId: string,
    documentType: string,
  ): Promise<string> {
    const documentId = crypto.randomUUID()
    const token = await this.hmppsAuthClient.getSystemClientToken(username)

    try {
      await new DocumentManagementApiClient(token).uploadDocument(
        prisonerId,
        documentId,
        fileToUpload,
        username,
        activeCaseLoadId,
        documentType,
      )
      fs.unlinkSync(fileToUpload.path)
      return documentId
    } catch (error) {
      throw new Error(`Failed to upload document: ${error.message}`)
    }
  }
}
