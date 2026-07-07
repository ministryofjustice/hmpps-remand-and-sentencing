import crypto from 'crypto'
import fs from 'fs'
import DocumentManagementApiClient from '../data/documentManagementApiClient'
import DocumentManagementService from './documentManagementService'

jest.mock('fs')
jest.mock('crypto')
jest.mock('../data/documentManagementApiClient')

describe('DocumentManagementService', () => {
  let apiClient: jest.Mocked<DocumentManagementApiClient>
  let service: DocumentManagementService
  const username = 'user1'
  const documentId = 'fixed-uuid'

  beforeEach(() => {
    jest.resetAllMocks()
    apiClient = new DocumentManagementApiClient(undefined) as jest.Mocked<DocumentManagementApiClient>
    service = new DocumentManagementService(apiClient)
    jest.spyOn(crypto, 'randomUUID').mockReturnValue(documentId as never)
  })

  describe('uploadDocument', () => {
    const file = { path: '/tmp/file', originalname: 'file.pdf', mimetype: 'application/pdf' } as Express.Multer.File

    it('generates a document id and passes it through to the api client', async () => {
      apiClient.uploadDocument.mockResolvedValue(undefined)

      const result = await service.uploadDocument('prisoner1', file, username, 'WARRANT')

      expect(apiClient.uploadDocument).toHaveBeenCalledWith('prisoner1', documentId, file, username, 'WARRANT')
      expect(result).toBe(documentId)
    })

    it('deletes the local temp file after a successful upload', async () => {
      apiClient.uploadDocument.mockResolvedValue(undefined)

      await service.uploadDocument('prisoner1', file, username, 'WARRANT')

      expect(fs.unlinkSync).toHaveBeenCalledWith(file.path)
    })

    it('does not delete the temp file if the upload fails', async () => {
      apiClient.uploadDocument.mockRejectedValue(new Error('upstream error'))

      await expect(service.uploadDocument('prisoner1', file, username, 'WARRANT')).rejects.toThrow()
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })

    it('wraps api client errors with a descriptive message', async () => {
      apiClient.uploadDocument.mockRejectedValue(new Error('upstream error'))

      await expect(service.uploadDocument('prisoner1', file, username, 'WARRANT')).rejects.toThrow(
        'Failed to upload document: upstream error',
      )
    })
  })

  describe('downloadDocument', () => {
    it('delegates to the api client with inline defaulted to false', async () => {
      const fileDownload = { body: Buffer.from('data'), header: {} }
      apiClient.downloadDocument.mockResolvedValue(fileDownload)

      const result = await service.downloadDocument(documentId, username)

      expect(apiClient.downloadDocument).toHaveBeenCalledWith(documentId, username, false)
      expect(result).toBe(fileDownload)
    })

    it('passes inline through when set to true', async () => {
      apiClient.downloadDocument.mockResolvedValue({ body: Buffer.from(''), header: {} })

      await service.downloadDocument(documentId, username, true)

      expect(apiClient.downloadDocument).toHaveBeenCalledWith(documentId, username, true)
    })
  })
})
