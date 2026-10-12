import type { Express } from 'express'
import { Readable } from 'stream'
import request from 'supertest'
import logger from '../../logger'
import { appWithAllRoutes, defaultServices } from './testutils/appSetup'

jest.mock('../../logger')

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET person image', () => {
  it('streams the prisoner image and sets caching headers', () => {
    defaultServices.prisonerService.getPrisonerImage.mockResolvedValue(Readable.from(['image-bytes']))

    return request(app)
      .get('/api/person/A1234AB/image')
      .expect(200)
      .expect('Content-Type', /image\/jpeg/)
      .expect('Cache-control', 'private, max-age=86400')
      .expect(res => {
        expect(defaultServices.prisonerService.getPrisonerImage).toHaveBeenCalledWith('A1234AB', 'user1')
        expect(res.body.toString()).toContain('image-bytes')
      })
  })

  it('falls back to the placeholder image when the service call fails', () => {
    defaultServices.prisonerService.getPrisonerImage.mockRejectedValue(new Error('not found'))

    return request(app)
      .get('/api/person/A1234AB/image')
      .expect(res => {
        expect(defaultServices.prisonerService.getPrisonerImage).toHaveBeenCalledWith('A1234AB', 'user1')
        // the fallback path serves a static file rather than the jpeg stream
        expect(res.headers['content-type']).not.toMatch(/image\/jpeg/)
      })
  })
})

describe('GET search offence', () => {
  it('returns the offence search result as JSON', () => {
    defaultServices.manageOffencesService.searchOffence.mockResolvedValue([{ code: 'TH68001' }] as never)

    return request(app)
      .get('/api/search-offence?searchString=theft')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(defaultServices.manageOffencesService.searchOffence).toHaveBeenCalledWith('theft', 'user1')
        expect(res.body).toEqual([{ code: 'TH68001' }])
      })
  })
})

describe('GET search court', () => {
  it('returns the court search result as JSON', () => {
    defaultServices.courtRegisterService.searchCourts.mockResolvedValue([{ courtId: 'EXECC' }] as never)

    return request(app)
      .get('/api/search-court?searchString=exeter')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect(res => {
        expect(defaultServices.courtRegisterService.searchCourts).toHaveBeenCalledWith('exeter', 'user1')
        expect(res.body).toEqual([{ courtId: 'EXECC' }])
      })
  })
})

describe('GET document download', () => {
  const header = {
    'content-disposition': 'attachment; filename="doc.pdf"',
    'content-length': '9',
    'content-type': 'application/pdf',
  }

  it('streams the document with disposition, length and type headers and does not request inline', () => {
    defaultServices.documentManagementService.downloadDocument.mockResolvedValue({
      body: Readable.from(['pdf-bytes']),
      header,
    } as never)

    return request(app)
      .get('/api/document/doc1/download')
      .expect(200)
      .expect('Content-Disposition', 'attachment; filename="doc.pdf"')
      .expect('Content-Type', 'application/pdf')
      .expect(res => {
        expect(defaultServices.documentManagementService.downloadDocument).toHaveBeenCalledWith('doc1', 'user1', false)
        expect(res.body.toString()).toContain('pdf-bytes')
      })
  })

  it('wraps a Buffer body in a stream before sending', () => {
    defaultServices.documentManagementService.downloadDocument.mockResolvedValue({
      body: Buffer.from('pdf-bytes'),
      header,
    } as never)

    return request(app)
      .get('/api/document/doc1/download')
      .expect(200)
      .expect(res => {
        expect(res.body.toString()).toContain('pdf-bytes')
      })
  })
})

describe('GET document view', () => {
  const header = {
    'content-disposition': 'inline; filename="doc.pdf"',
    'content-length': '9',
    'content-type': 'application/pdf',
  }

  it('requests the document inline and streams it', () => {
    defaultServices.documentManagementService.downloadDocument.mockResolvedValue({
      body: Readable.from(['pdf-bytes']),
      header,
    } as never)

    return request(app)
      .get('/api/document/doc1/view-document/doc.pdf')
      .expect(200)
      .expect('Content-Disposition', 'inline; filename="doc.pdf"')
      .expect(res => {
        expect(defaultServices.documentManagementService.downloadDocument).toHaveBeenCalledWith('doc1', 'user1', true)
      })
  })
})

describe('GET generated document view', () => {
  it('should stream a Readable body with the generated content type and disposition headers', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue({
      body: Readable.from(['pdf byte array']),
      header: { 'content-type': 'application/pdf', 'content-length': '14' },
    } as never)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(200)
      .expect('Content-Type', 'application/pdf')
      .expect(res => {
        expect(defaultServices.documentGeneratorService.streamDocumentGeneratedDocument).toHaveBeenCalledWith(
          expect.objectContaining({ params: expect.objectContaining({ documentType: 'f986' }) }),
          expect.anything(),
          'f986',
        )
        expect(res.body.toString()).toContain('pdf byte array')
      })
  })

  it('should wrap a Buffer body in a stream before sending', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue({
      body: Buffer.from('pdf byte array'),
      header: { 'content-type': 'application/pdf', 'content-length': '14' },
    } as never)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(200)
      .expect(res => {
        expect(res.body.toString()).toContain('pdf byte array')
      })
  })

  it('should default content-type to application/pdf when the generator does not supply one', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue({
      body: Buffer.from('pdf byte array'),
      header: { 'content-length': '14' },
    } as never)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(200)
      .expect('Content-Type', 'application/pdf')
  })

  it('should return 500 when the generator resolves with no result', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue(null)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Failed to generate document')
        expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to generate document f986')
      })
  })

  it('should return 500 when the result body is neither a Readable nor a Buffer', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue({
      body: 'sfdfsdfsd',
      header: {},
    } as never)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Failed to generate document')
      })
  })

  it('should return 500 when the generator service rejects', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockRejectedValue(
      new Error('upstream failure'),
    )

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/f986')
      .expect(500)
      .expect(res => {
        expect(res.text).toContain('Failed to generate document')
        expect(logger.error).toHaveBeenCalledWith(expect.any(Error), 'Failed to generate document f986')
      })
  })

  it('should pass a different documentType param straight through to the service', () => {
    defaultServices.documentGeneratorService.streamDocumentGeneratedDocument.mockResolvedValue({
      body: Buffer.from('bytes'),
      header: { 'content-length': '5' },
    } as never)

    return request(app)
      .get('/api/persons/A1234AB/court-appearances/60B6BB03-549A-4A2C-8874-85ACCFA62880/documents/anothertype')
      .expect(res => {
        expect(defaultServices.documentGeneratorService.streamDocumentGeneratedDocument).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          'anothertype',
        )
      })
  })
})
