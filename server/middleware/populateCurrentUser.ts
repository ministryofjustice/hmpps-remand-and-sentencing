import { RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import logger from '../../logger'
import { convertToTitleCase } from '../utils/utils'
import type { CaseLoad } from '../@types/prisonApi/types'
import UserService from '../services/userService'

export function populateCurrentUser(): RequestHandler {
  return async (req, res, next) => {
    try {
      const {
        name,
        user_id: userId,
        authorities: roles = [],
      } = jwtDecode(res.locals.user.token) as {
        name?: string
        user_id?: string
        authorities?: string[]
      }
      const userRoles = roles.map(role => role.substring(role.indexOf('_') + 1))
      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name),
        userRoles,
      }

      if (res.locals.user.authSource === 'nomis') {
        res.locals.user.staffId = parseInt(userId, 10) || undefined
        res.locals.user.hasAdjustmentsAccess = userRoles.includes('ADJUSTMENTS_MAINTAINER')
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
