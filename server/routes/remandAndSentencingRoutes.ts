import { RequestHandler } from 'express'
import PrisonerService from '../services/prisonerService'

export default class RemandAndSentencingRoutes {
  constructor(private readonly prisonerService: PrisonerService) {}

  public start: RequestHandler = async (req, res): Promise<void> => {
    const { token } = res.locals.user
    const { nomsId } = req.params
    const prisonerDetails = await this.prisonerService.getPrisonerDetails(nomsId, token)
    return res.render('pages/start', {
      prisonerDetails,
      nomsId,
    })
  }
}
