import { Router } from 'express'
import type { Services } from '../services'
import HmctsResultCodeAdminRoutesHandler from './handlers/hmctsResultCodeAdminRoutesHandler'

export default function hmctsResultCodeDataAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new HmctsResultCodeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)

  router.get('/add', routes.add)
  router.post('/add', routes.submitAdd)

  router.get('/edit/:resultUuid', routes.edit)
  router.post('/edit/:resultUuid', routes.submitEdit)
  return router
}
