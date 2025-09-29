import { RequestHandler } from 'express'
import path from 'path'
import { Readable } from 'stream'
import PrisonerService from '../services/prisonerService'
import ManageOffencesService from '../services/manageOffencesService'
import CourtRegisterService from '../services/courtRegisterService'
import DocumentManagementService from '../services/documentManagementService'
import logger from '../../logger'

const placeHolderImage = path.join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
export default class ApiRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly courtRegisterService: CourtRegisterService,
    private readonly documentManagementService: DocumentManagementService,
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

  public downloadDocument: RequestHandler = async (req, res): Promise<void> => {
    const { documentId } = req.params
    return this.documentManagementService.downloadDocument(documentId, res.locals.user.username).then(response => {
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
}
