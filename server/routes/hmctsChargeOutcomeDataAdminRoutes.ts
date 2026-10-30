import { Router } from 'express'
import type { Services } from '../services'
import HmctsChargeOutcomeAdminRoutesHandler from './handlers/hmctsChargeOutcomeAdminRoutesHandler'

export default function hmctsChargeOutcomeDataAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new HmctsChargeOutcomeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)

  router.get('/add', routes.add)
  router.post('/add', routes.submitAdd)

  router.get('/edit/:chargeOutcomeUuid', routes.edit)
  router.post('/edit/:chargeOutcomeUuid', routes.submitEdit)
  return router
}
