import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerService from '../services/prisonerService'
import PrisonerDetailsModel from '../routes/data/PrisonerDetailsModel'

export default function setupPrisonerDetails(prisonerService: PrisonerService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    try {
      const { token } = res.locals.user
      const prisonApiPrisoner = await prisonerService.getPrisonerDetails(nomsId, token)
      res.locals.prisonerDetails = new PrisonerDetailsModel(prisonApiPrisoner)
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve prisoner details for: ${nomsId}`)
      next(error)
    }
  }
}
