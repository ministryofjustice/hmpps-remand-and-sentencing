import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerService from '../services/prisonerService'

export default function setupPrisonerDetails(prisonerService: PrisonerService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    try {
      const { token } = res.locals.user
      res.locals.prisonerDetails = await prisonerService.getPrisonerDetails(nomsId, token)
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve prisoner details for: ${nomsId}`)
      next(error)
    }
  }
}
