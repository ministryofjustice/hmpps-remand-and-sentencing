import { Router } from 'express'
import type { Services } from '../services'
import AppearanceOutcomeAdminRoutesHandler from './handlers/appearanceOutcomeAdminRoutesHandler'

export default function appearanceOutcomeDataAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new AppearanceOutcomeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)
  return router
}
