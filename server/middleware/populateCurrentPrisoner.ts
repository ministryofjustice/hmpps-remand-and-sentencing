import { RequestHandler } from 'express'
import logger from '../../logger'
import PrisonerSearchService from '../services/prisonerSearchService'
import { PrisonUser } from '../interfaces/hmppsUser'
import FullPageError from '../model/FullPageError'
import { PrisonerSearchApiPrisoner } from '../@types/prisonerSearchApi/prisonerSearchTypes'
import { restoreAndClearSession } from '../data/sessionRecoveryStore'
import { restoreJourneySession } from './setUpWebSession'

export default function populateCurrentPrisoner(prisonerSearchService: PrisonerSearchService): RequestHandler {
  return async (req, res, next) => {
    const { nomsId } = req.params
    const user = res.locals.user as PrisonUser

    if (user.username && nomsId) {
      try {
        const prisoner = await prisonerSearchService.getPrisonerDetails(nomsId, user.username)
        res.locals.prisoner = prisoner
        if (!canAccessPrisoner(user, prisoner)) {
          throw FullPageError.notInCaseLoadError()
        }

        const recoveredSession = await restoreAndClearSession(user.username, nomsId)
        if (recoveredSession) {
          restoreJourneySession(req.session, recoveredSession)
          logger.info(`Restored session data for user ${user.username} and prisoner ${nomsId} after token refresh`)
        }
      } catch (error) {
        logger.error(error, `Failed to get prisoner with prisoner number: ${nomsId}`)
        if (error.responseStatus === 404) {
          throw FullPageError.notInCaseLoadError()
        }
        next(error)
      }
    }

    return next()
  }
}

function canAccessPrisoner(user: PrisonUser, prisonerDetails: PrisonerSearchApiPrisoner): boolean {
  return (
    user.caseLoads.map(caseLoad => caseLoad.caseLoadId).includes(prisonerDetails.prisonId) ||
    ['TRN'].includes(prisonerDetails.prisonId) ||
    canAccessOutPrisoner(user, prisonerDetails)
  )
}

function canAccessOutPrisoner(user: PrisonUser, prisonerDetails: PrisonerSearchApiPrisoner): boolean {
  return user.hasInactiveBookingsAccess && prisonerDetails.prisonId === 'OUT'
}
