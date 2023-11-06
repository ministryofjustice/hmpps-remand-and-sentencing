import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerDetailsModel from '../routes/data/PrisonerDetailsModel'
import RemandAndSentencingService from '../services/remandAndSentencingService'

export default function setupPrisonerDetails(remandAndSentencingService: RemandAndSentencingService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    try {
      const { token } = res.locals.user
      const remandAndSentencingPerson = await remandAndSentencingService.getPersonDetails(nomsId, token)
      res.locals.prisonerDetails = new PrisonerDetailsModel(remandAndSentencingPerson)
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve prisoner details for: ${nomsId}`)
      next(error)
    }
  }
}
