import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import RemandAndSentencingRoutes from './remandAndSentencingRoutes'
import { Services } from '../services'
import ApiRoutes from './apiRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const remandAndSentencingRoutes = new RemandAndSentencingRoutes()
  const apiRoutes = new ApiRoutes(services.prisonerService)

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/person/:nomsId', remandAndSentencingRoutes.start)

  get('/api/person/:nomsId/image', apiRoutes.personImage)

  return router
}
