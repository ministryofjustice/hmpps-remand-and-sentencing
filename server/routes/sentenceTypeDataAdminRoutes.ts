import { Router } from 'express'
import type { Services } from '../services'
import SentenceTypeAdminRoutesHandler from './handlers/sentenceTypeAdminRoutesHandler'

export default function sentenceTypeDataAdminRoutes(services: Services): Router {
  const router = Router()
  const routes = new SentenceTypeAdminRoutesHandler(services.refDataService)
  router.get('/', routes.index)

  router.get('/add', routes.add)
  router.post('/add', routes.submitAdd)
  return router
}
