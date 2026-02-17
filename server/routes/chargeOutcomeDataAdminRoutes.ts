import { Router } from 'express'
import type { Services } from '../services'
import ChargeOutcomeAdminRoutesHandler from './handlers/chargeOutcomeAdminRoutesHandler'

export default function chargeOutcomeDataAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new ChargeOutcomeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)

  router.get('/add', routes.add)
  router.post('/add', routes.submitAdd)

  router.get('/edit/:chargeOutcomeUuid', routes.edit)
  router.post('/edit/:chargeOutcomeUuid', routes.submitEdit)
  return router
}
