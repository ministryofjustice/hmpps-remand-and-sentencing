import { Router } from 'express'
import DatafixAdminRoutesHandler from './handlers/datafixAdminRoutesHandler'
import { Services } from '../services'

export default function datafixAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new DatafixAdminRoutesHandler(services.remandAndSentencingService)
  router.get('/', routes.index)
  router.post('/', routes.submitDatafix)

  return router
}
