import { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../../logger'
import { convertToTitleCase } from '../utils/utils'
import type { CaseLoad } from '../@types/prisonApi/types'
import UserService from '../services/userService'
import { AuthSource, HmppsUser } from '../interfaces/hmppsUser'

export function populateCurrentUser(): RequestHandler {
  return async (req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
        auth_source: authSource,
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
        auth_source?: string
      }
      const userRoles = roles.map(role => role.substring(role.indexOf('_') + 1))
      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name),
        userRoles,
        authSource: authSource as AuthSource,
      } as HmppsUser

      if (res.locals.user.authSource === 'nomis') {
        res.locals.user.staffId = parseInt(userId, 10) || undefined
        res.locals.user.hasInactiveBookingsAccess = userRoles.includes('INACTIVE_BOOKINGS')
        res.locals.user.hasRecallsAccess = userRoles.includes('RECALL_MAINTAINER')
      }

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}

export function getUserCaseLoads(userService: UserService): RequestHandler {
  return async (req, res, next) => {
    try {
      if (res.locals.user && res.locals.user.authSource === 'nomis') {
        const userCaseLoads = await userService.getUserCaseLoads(res.locals.user.token)
        if (userCaseLoads && Array.isArray(userCaseLoads)) {
          const availableCaseLoads = userCaseLoads.filter(caseload => caseload.type !== 'APP')
          const activeCaseLoad = availableCaseLoads.filter((caseLoad: CaseLoad) => caseLoad.currentlyActive)[0]

          res.locals.user.caseLoads = availableCaseLoads

          if (activeCaseLoad) {
            res.locals.user.activeCaseLoadId = activeCaseLoad.caseLoadId
          }
        } else {
          logger.info('No user case loads available')
        }
      }
      next()
    } catch (error) {
      logger.error(error, `Failed to retrieve case loads for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  }
}
