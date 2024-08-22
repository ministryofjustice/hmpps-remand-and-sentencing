import { RequestHandler } from 'express'
import path from 'path'
import PrisonerService from '../services/prisonerService'
import ManageOffencesService from '../services/manageOffencesService'
import CaseOutcomeService from '../services/caseOutcomeService'
import CourtRegisterService from '../services/courtRegisterService'

const placeHolderImage = path.join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
export default class ApiRoutes {
  constructor(
    private readonly prisonerService: PrisonerService,
    private readonly manageOffencesService: ManageOffencesService,
    private readonly caseOutcomeService: CaseOutcomeService,
    private readonly courtRegisterService: CourtRegisterService,
  ) {}

  public personImage: RequestHandler = async (req, res): Promise<void> => {
    const { nomsId } = req.params
    return this.prisonerService
      .getPrisonerImage(nomsId, res.locals.user.token)
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
    const result = await this.manageOffencesService.searchOffence(searchString as string, res.locals.user.token)
    res.status(200).send(result)
  }

  public searchCaseOutcome: RequestHandler = async (req, res): Promise<void> => {
    const { searchString, type } = req.query
    const result = this.caseOutcomeService.searchOutcomes(searchString as string, type as string)
    res.status(200).send(result)
  }

  public searchCourts: RequestHandler = async (req, res): Promise<void> => {
    const { searchString } = req.query
    const result = await this.courtRegisterService.searchCourts(searchString as string, res.locals.user.username)
    res.status(200).send(result)
  }
}
