import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerSearchService from '../services/prisonerSearchService'

export default function populateCurrentPrisoner(prisonerSearchService: PrisonerSearchService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    try {
      const { username } = res.locals.user
      const prisoner = await prisonerSearchService.getPrisonerDetails(nomsId, username)
      res.locals.prisoner = prisoner
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve prisoner details for: ${nomsId}`)
      next(error)
    }
  }
}
