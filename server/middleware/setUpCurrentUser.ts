import { jwtDecode } from 'jwt-decode'
import express from 'express'
import { convertToTitleCase } from '../utils/utils'
import logger from '../../logger'
import UserService from '../services/userService'
import { CaseLoad } from '../@types/prisonApi/types'
import { AuthSource } from '../interfaces/hmppsUser'

export default function setUpCurrentUser(userService: UserService) {
  const router = express.Router()

  router.use(async (req, res, next) => {
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
        auth_source?: AuthSource
      }
      const userRoles = roles.map(role => role.substring(role.indexOf('_') + 1))
      res.locals.user = {
        ...res.locals.user,
        userId,
        name,
        displayName: convertToTitleCase(name),
        userRoles,
      }
      res.locals.user.authSource = authSource

      if (res.locals.user.authSource === 'nomis') {
        res.locals.user.staffId = parseInt(userId, 10) || undefined
        res.locals.user.hasInactiveBookingsAccess = userRoles.includes('INACTIVE_BOOKINGS')
        res.locals.user.hasRecallsAccess = userRoles.includes('RECALL_MAINTAINER')
        await getUserCaseLoads(res, userService)
      }

      next()
    } catch (error) {
      logger.error(error, `Failed to populate user details for: ${res.locals.user && res.locals.user.username}`)
      next(error)
    }
  })

  return router
}

async function getUserCaseLoads(res, userService: UserService) {
  try {
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
  } catch (error) {
    logger.error(error, `Failed to retrieve case loads for: ${res.locals.user && res.locals.user.username}`)
    throw error
  }
}
