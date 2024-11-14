import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerSearchService from '../services/prisonerSearchService'
import { PrisonUser } from '../interfaces/hmppsUser'
import FullPageError from '../model/FullPageError'

export default function populateCurrentPrisoner(prisonerSearchService: PrisonerSearchService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    const { username, caseLoads } = res.locals.user as PrisonUser

    if (username && nomsId) {
      try {
        const prisoner = await prisonerSearchService.getPrisonerDetails(nomsId, username)
        res.locals.prisoner = prisoner
        if (
          prisoner.prisonId === 'OUT' ||
          !caseLoads.map(caseload => caseload.caseLoadId).includes(prisoner.prisonId)
        ) {
          throw FullPageError.notInCaseLoadError()
        }
      } catch (error) {
        logger.error(error, `Failed to get prisoner with prisoner number: ${nomsId}`)
        next(error)
      }
    }

    return next()
  }
}
