import { Router } from 'express'
import SentenceTypesRoutes from './handlers/sentenceTypesRoutes'
import type { Services } from '../services'

export default function sentenceTypeRoutes(services: Services): Router {
  const router = Router()
  const routes = new SentenceTypesRoutes(services.remandAndSentencingService)

  router.get('/', routes.index)

  router.get('/legacy', routes.getLegacySentenceTypes)

  router.get('/legacy/detail', routes.getLegacySentenceTypeDetail)

  return router
}
