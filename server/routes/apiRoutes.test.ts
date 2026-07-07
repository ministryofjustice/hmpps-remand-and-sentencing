import { Readable } from 'stream'
import ApiRoutes from './apiRoutes'
import PrisonerService from '../services/prisonerService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'

jest.mock('../services/prisonerService')
jest.mock('../services/manageOffencesService')
jest.mock('../services/courtRegisterService')
jest.mock('../services/documentManagementService')

const username = 'user1'

const mockResponse = () => {
  const res: Record<string, unknown> = {}
  res.set = jest.fn().mockReturnValue(res)
  res.removeHeader = jest.fn().mockReturnValue(res)
  res.type = jest.fn().mockReturnValue(res)
  res.status = jest.fn().mockReturnValue(res)
  res.send = jest.fn().mockReturnValue(res)
  res.sendFile = jest.fn().mockReturnValue(res)
  res.locals = { user: { username } }
  return res as unknown as Response & { locals: { user: { username: string } } } & Record<string, jest.Mock>
}

describe('ApiRoutes', () => {
  let prisonerService: jest.Mocked<PrisonerService>
  let manageOffencesService: jest.Mocked<ManageOffencesService>
  let courtRegisterService: jest.Mocked<CourtRegisterService>
  let documentManagementService: jest.Mocked<DocumentManagementService>
  let apiRoutes: ApiRoutes

  beforeEach(() => {
    jest.resetAllMocks()
    prisonerService = new PrisonerService(undefined) as jest.Mocked<PrisonerService>
    manageOffencesService = new ManageOffencesService(undefined) as jest.Mocked<ManageOffencesService>
    courtRegisterService = new CourtRegisterService(undefined) as jest.Mocked<CourtRegisterService>
    documentManagementService = new DocumentManagementService(undefined) as jest.Mocked<DocumentManagementService>
    apiRoutes = new ApiRoutes(prisonerService, manageOffencesService, courtRegisterService, documentManagementService)
  })

  describe('personImage', () => {
    it('pipes the image data and sets caching headers on success', async () => {
      const dataStream = Readable.from(['test-data'])
      dataStream.pipe = jest.fn().mockReturnValue(dataStream)
      prisonerService.getPrisonerImage.mockResolvedValue(dataStream as never)

      const req = { params: { nomsId: 'A1234BC' } } as never
      const res = mockResponse()

      await apiRoutes.personImage(req, res as never, undefined as never)

      expect(prisonerService.getPrisonerImage).toHaveBeenCalledWith('A1234BC', username)
      expect(res.set).toHaveBeenCalledWith('Cache-control', 'private, max-age=86400')
      expect(res.removeHeader).toHaveBeenCalledWith('pragma')
      expect(res.type).toHaveBeenCalledWith('image/jpeg')
      expect(dataStream.pipe).toHaveBeenCalledWith(res)
    })

    it('falls back to the placeholder image when the service call fails', async () => {
      prisonerService.getPrisonerImage.mockRejectedValue(new Error('not found'))

      const req = { params: { nomsId: 'A1234BC' } } as never
      const res = mockResponse()

      await apiRoutes.personImage(req, res as never, undefined as never)

      expect(res.sendFile).toHaveBeenCalledWith(expect.stringContaining('prisoner-profile-image.png'))
    })
  })

  describe('searchOffence', () => {
    it('returns the search result with a 200 status', async () => {
      manageOffencesService.searchOffence.mockResolvedValue(['result'] as never)

      const req = { query: { searchString: 'burglary' } } as never
      const res = mockResponse()

      await apiRoutes.searchOffence(req, res as never, undefined as never)

      expect(manageOffencesService.searchOffence).toHaveBeenCalledWith('burglary', username)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(['result'])
    })
  })

  describe('searchCourts', () => {
    it('returns the search result with a 200 status', async () => {
      courtRegisterService.searchCourts.mockResolvedValue(['result'] as never)

      const req = { query: { searchString: 'exeter' } } as never
      const res = mockResponse()

      await apiRoutes.searchCourts(req, res as never, undefined as never)

      expect(courtRegisterService.searchCourts).toHaveBeenCalledWith('exeter', username)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith(['result'])
    })
  })

  describe('downloadDocument and viewDocument', () => {
    const header = {
      'content-disposition': 'attachment; filename="doc.pdf"',
      'content-length': '1234',
      'content-type': 'application/pdf',
    }

    it('pipes a Readable body straight through and sets response headers', async () => {
      const fileStream = Readable.from(['test-data'])
      fileStream.pipe = jest.fn().mockReturnValue(fileStream)
      documentManagementService.downloadDocument.mockResolvedValue({ body: fileStream, header } as never)

      const req = { params: { documentId: 'doc1' } } as never
      const res = mockResponse()

      await apiRoutes.downloadDocument(req, res as never, undefined as never)

      expect(documentManagementService.downloadDocument).toHaveBeenCalledWith('doc1', username, false)
      expect(res.set).toHaveBeenCalledWith('content-disposition', header['content-disposition'])
      expect(res.set).toHaveBeenCalledWith('content-length', header['content-length'])
      expect(res.set).toHaveBeenCalledWith('content-type', header['content-type'])
      expect(fileStream.pipe).toHaveBeenCalledWith(res)
    })

    it('wraps a Buffer body in a Readable before piping', async () => {
      documentManagementService.downloadDocument.mockResolvedValue({
        body: Buffer.from('pdf-bytes'),
        header,
      } as never)

      const req = { params: { documentId: 'doc1' } } as never
      const res = mockResponse()

      const pipeSpy = jest.spyOn(Readable.prototype, 'pipe').mockReturnValue(res as never)

      await apiRoutes.downloadDocument(req, res as never, undefined as never)

      expect(pipeSpy).toHaveBeenCalledWith(res)
      pipeSpy.mockRestore()
    })

    it('throws when the body is neither a Readable nor a Buffer', async () => {
      documentManagementService.downloadDocument.mockResolvedValue({ body: 'not-a-stream', header } as never)

      const req = { params: { documentId: 'doc1' } } as never
      const res = mockResponse()

      await expect(apiRoutes.downloadDocument(req, res as never, undefined as never)).rejects.toThrow(
        'Failed to retrieve document content.',
      )
    })

    it('viewDocument requests the document inline', async () => {
      const fileStream = Readable.from(['test-data'])

      fileStream.pipe = jest.fn().mockReturnValue(fileStream)
      documentManagementService.downloadDocument.mockResolvedValue({ body: fileStream, header } as never)

      const req = { params: { documentId: 'doc1' } } as never
      const res = mockResponse()

      await apiRoutes.viewDocument(req, res as never, undefined as never)

      expect(documentManagementService.downloadDocument).toHaveBeenCalledWith('doc1', username, true)
    })
  })
})
