import { RestClient, asSystem } from '@ministryofjustice/hmpps-rest-client'
import DocumentManagementApiClient from './documentManagementApiClient'

jest.mock('@ministryofjustice/hmpps-rest-client', () => {
  const actual = jest.requireActual('@ministryofjustice/hmpps-rest-client')
  return {
    ...actual,
    asSystem: jest.fn().mockReturnValue('system-context'),
  }
})

describe('DocumentManagementApiClient', () => {
  let client: DocumentManagementApiClient
  const username = 'user1'

  beforeEach(() => {
    jest.clearAllMocks()
    client = new DocumentManagementApiClient(undefined)
  })

  describe('uploadDocument', () => {
    it('posts the file with the expected metadata and headers', async () => {
      const postMultiPartSpy = jest.spyOn(client, 'postMultiPart' as never).mockResolvedValue(undefined as never)
      const file = { path: '/tmp/file', originalname: 'file.pdf', mimetype: 'application/pdf' } as Express.Multer.File

      await client.uploadDocument('prisoner1', 'doc1', file, username, 'WARRANT')

      expect(postMultiPartSpy).toHaveBeenCalledWith({
        path: '/documents/WARRANT/doc1',
        fileToUpload: file,
        metadata: {
          prisonerId: 'prisoner1',
          source: 'RemandSentencingUser',
          status: 'Awaiting',
        },
        headers: {
          'Service-Name': 'Remand and Sentencing',
          Username: username,
        },
        username,
      })
    })

    it('wraps errors with a descriptive message', async () => {
      jest.spyOn(client, 'postMultiPart' as never).mockRejectedValue(new Error('network down') as never)
      const file = { path: '/tmp/file', originalname: 'file.pdf', mimetype: 'application/pdf' } as Express.Multer.File

      await expect(client.uploadDocument('prisoner1', 'doc1', file, username, 'WARRANT')).rejects.toThrow(
        'Error in Document Management API: network down',
      )
    })
  })

  describe('deleteDocument', () => {
    it('calls delete with the correct path and headers, scoped to the system context', async () => {
      const deleteSpy = jest.spyOn(RestClient.prototype, 'delete').mockResolvedValue(undefined)

      await client.deleteDocument('doc1', username)

      expect(asSystem).toHaveBeenCalledWith(username)
      expect(deleteSpy).toHaveBeenCalledWith(
        {
          path: '/documents/doc1',
          headers: {
            'Service-Name': 'Remand and Sentencing',
            Username: username,
          },
        },
        'system-context',
      )
    })

    it('wraps errors with a descriptive message', async () => {
      jest.spyOn(RestClient.prototype, 'delete').mockRejectedValue(new Error('not found'))

      await expect(client.deleteDocument('doc1', username)).rejects.toThrow('Error deleting document: not found')
    })
  })

  describe('downloadDocument', () => {
    it('requests the file as a blob without inline query when inline is not passed', async () => {
      const getSpy = jest.spyOn(RestClient.prototype, 'get').mockResolvedValue({ body: Buffer.from('') })

      await client.downloadDocument('doc1', username)

      expect(getSpy).toHaveBeenCalledWith(
        {
          path: '/documents/doc1/file',
          query: undefined,
          headers: {
            'Service-Name': 'Remand and Sentencing',
            Username: username,
          },
          responseType: 'blob',
          raw: true,
        },
        'system-context',
      )
    })

    it('adds the inline query param when inline is true', async () => {
      const getSpy = jest.spyOn(RestClient.prototype, 'get').mockResolvedValue({ body: Buffer.from('') })

      await client.downloadDocument('doc1', username, true)

      expect(getSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          query: { inline: true },
        }),
        'system-context',
      )
    })

    it('returns whatever the underlying get call resolves', async () => {
      const fileDownload = { body: Buffer.from('data'), header: { 'content-type': 'application/pdf' } }
      jest.spyOn(RestClient.prototype, 'get').mockResolvedValue(fileDownload)

      const result = await client.downloadDocument('doc1', username)

      expect(result).toEqual(fileDownload)
    })
  })

  describe('postMultiPart', () => {
    it('builds the superagent request with attachment, metadata field, auth and headers', async () => {
      const chain: Record<string, jest.Mock> = {}
      const chainable = (name: string) => {
        chain[name] = jest.fn().mockReturnValue(chain)
        return chain[name]
      }
      chainable('query')
      chainable('attach')
      chainable('field')
      chainable('agent')
      chainable('retry')
      chainable('auth')
      chainable('set')
      chainable('responseType')
      chain.timeout = jest.fn().mockResolvedValue({ body: 'result-body' })

      const superagent = { post: jest.fn().mockReturnValue(chain) }

      type MakeRestClientCall = (
        context: unknown,
        fn: (args: { superagent: typeof superagent; token: string; agent: string }) => unknown,
      ) => Promise<unknown>

      const clientWithPrivateMethod = client as unknown as { makeRestClientCall: MakeRestClientCall }

      jest
        .spyOn(clientWithPrivateMethod, 'makeRestClientCall')
        .mockImplementation(async (_context, fn) => fn({ superagent, token: 'token123', agent: 'agent123' }))

      const file = { path: '/tmp/file', originalname: 'file.pdf', mimetype: 'application/pdf' }

      const result = await client.postMultiPart({
        path: '/documents/WARRANT/doc1',
        fileToUpload: file,
        metadata: { prisonerId: 'prisoner1' },
        headers: { 'Service-Name': 'Remand and Sentencing' },
        username,
      } as never)

      expect(superagent.post).toHaveBeenCalledWith(expect.stringContaining('/documents/WARRANT/doc1'))
      expect(chain.attach).toHaveBeenCalledWith('file', file.path, {
        filename: file.originalname,
        contentType: file.mimetype,
      })
      expect(chain.field).toHaveBeenCalledWith('metadata', JSON.stringify({ prisonerId: 'prisoner1' }))
      expect(chain.auth).toHaveBeenCalledWith('token123', { type: 'bearer' })
      expect(chain.set).toHaveBeenCalledWith({ 'Service-Name': 'Remand and Sentencing' })
      expect(result).toBe('result-body')
    })

    it('returns the raw superagent result when raw is true', async () => {
      const chain: Record<string, jest.Mock> = {}
      const chainable = (name: string) => {
        chain[name] = jest.fn().mockReturnValue(chain)
        return chain[name]
      }
      chainable('query')
      chainable('attach')
      chainable('field')
      chainable('agent')
      chainable('retry')
      chainable('auth')
      chainable('set')
      chainable('responseType')
      const rawResult = { body: 'result-body', header: { 'content-type': 'application/pdf' } }
      chain.timeout = jest.fn().mockResolvedValue(rawResult)

      const superagent = { post: jest.fn().mockReturnValue(chain) }
      type MakeRestClientCall = (
        context: unknown,
        fn: (args: { superagent: typeof superagent; token: string; agent: string }) => unknown,
      ) => Promise<unknown>

      const clientWithPrivateMethod = client as unknown as { makeRestClientCall: MakeRestClientCall }

      jest
        .spyOn(clientWithPrivateMethod, 'makeRestClientCall')
        .mockImplementation(async (_context, fn) => fn({ superagent, token: 'token123', agent: 'agent123' }))

      const result = await client.postMultiPart({
        path: '/documents/WARRANT/doc1',
        fileToUpload: { path: '/tmp/file', originalname: 'file.pdf', mimetype: 'application/pdf' },
        raw: true,
        username,
      } as never)

      expect(result).toBe(rawResult)
    })
  })
})
