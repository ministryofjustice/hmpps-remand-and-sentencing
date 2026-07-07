import type { Express } from 'express'
import { Readable } from 'stream'
import request from 'supertest'
import { appWithAllRoutes, defaultServices } from './testutils/appSetup'

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
