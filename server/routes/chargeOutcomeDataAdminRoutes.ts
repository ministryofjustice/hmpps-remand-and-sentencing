import { Router } from 'express'
import type { Services } from '../services'
import ChargeOutcomeAdminRoutesHandler from './handlers/chargeOutcomeAdminRoutesHandler'
import authorisationMiddleware from '../middleware/authorisationMiddleware'

export default function chargeOutcomeDataAdminRoutes(services: Services): Router {
  const router = Router()
  router.use(authorisationMiddleware(['ROLE_RAS_REFERENCE_ADMIN']))
  const routes = new ChargeOutcomeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)
  return router
}
