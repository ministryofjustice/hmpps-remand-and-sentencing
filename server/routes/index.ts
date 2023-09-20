import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import RemandAndSentencingRoutes from './remandAndSentencingRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const remandAndSentencingRoutes = new RemandAndSentencingRoutes()

  get('/', (req, res, next) => {
    res.render('pages/index')
  })

  get('/person/:nomsId', remandAndSentencingRoutes.start)

  return router
}
