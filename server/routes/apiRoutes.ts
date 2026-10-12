import type { FileDownload } from 'models'
import { Request, Response, RequestHandler } from 'express'
import path from 'path'
import { Readable } from 'stream'
import PrisonerService from '../services/prisonerService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import logger from '../../logger'
import DocumentGeneratorService from '../services/documentGeneratorService'

const placeHolderImage = path.join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
export default class ApiRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly documentGeneratorService: DocumentGeneratorService,
  ) {}

  public personImage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return this.prisonerService
      .getPrisonerImage(nomsId, res.locals.user.username)
      .then(data => {
        res.set('Cache-control', 'private, max-age=86400')
        res.removeHeader('pragma')
        res.type('image/jpeg')
        data.pipe(res)
      })
      .catch(_error => {
        res.sendFile(placeHolderImage)
      })
  }

  public searchOffence: RequestHandler = async (req, res): Promise<void> => {
    const { searchString } = req.query
    const result = await this.manageOffencesService.searchOffence(searchString as string, res.locals.user.username)
    res.status(200).send(result)
  }

  public searchCourts: RequestHandler = async (req, res): Promise<void> => {
    const { searchString } = req.query
    const result = await this.courtRegisterService.searchCourts(searchString as string, res.locals.user.username)
    res.status(200).send(result)
  }

  private streamDocument = async (req: Request, res: Response, inline: boolean): Promise<void> => {
    const { documentId } = req.params

    return this.documentManagementService
      .downloadDocument(documentId, res.locals.user.username, inline)
      .then(response => {
        let fileStream: Readable | undefined

        if (response.body instanceof Readable) {
          fileStream = response.body
        } else if (Buffer.isBuffer(response.body)) {
          fileStream = new Readable()
          fileStream.push(response.body)
          fileStream.push(null)
        } else {
          logger.error(`Document management service returned unexpected type for documentId: ${documentId}`)
          throw new Error('Failed to retrieve document content.')
        }

        res.set('content-disposition', response.header['content-disposition'])
        res.set('content-length', response.header['content-length'])
        res.set('content-type', response.header['content-type'])

        fileStream.pipe(res)
      })
  }

  public downloadDocument: RequestHandler = async (req, res): Promise<void> => {
    return this.streamDocument(req, res, false)
  }

  public viewDocument: RequestHandler = async (req, res): Promise<void> => {
    return this.streamDocument(req, res, true)
  }

  /**
   * Unlike the downloadDocument and viewDocument functions
   * which reach out to the documentManagementService this
   * function's responsibility is to open 'just in time'
   * generated documents that are ephemeral and never persisted
   * @param req
   * @param res
   */
  public viewGeneratedDocument: RequestHandler = async (req, res): Promise<void> => {
    const { documentType } = req.params

    try {
      const result: FileDownload = await this.documentGeneratorService.streamDocumentGeneratedDocument(
        req,
        res,
        documentType,
      )

      if (!result) {
        throw new Error('No data returned from document generator')
      }

      let fileStream: Readable
      if (result.body instanceof Readable) {
        fileStream = result.body
      } else if (Buffer.isBuffer(result.body)) {
        fileStream = new Readable()
        fileStream.push(result.body)
        fileStream.push(null)
      } else {
        throw new Error('Unexpected body type returned from document generator')
      }

      res.set('content-type', result.header['content-type'] ?? 'application/pdf')
      res.set('content-disposition', `inline; filename="${documentType}'`)
      res.set('content-length', result.header['content-length'])

      fileStream.pipe(res)
    } catch (error) {
      logger.error(error, `Failed to generate document ${documentType}`)
      res.status(500).send('Failed to generate document')
    }
  }
}
