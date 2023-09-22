import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import RemandAndSentencingRoutes from './remandAndSentencingRoutes'
import { Services } from '../services'
import ApiRoutes from './apiRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const remandAndSentencingRoutes = new RemandAndSentencingRoutes(services.courtCaseService)
  const apiRoutes = new ApiRoutes(services.prisonerService)

  get('/', (req, res, next) => {
    res.render('pages/index')
  })
  get('/api/person/:nomsId/image', apiRoutes.personImage)

  get('/person/:nomsId', remandAndSentencingRoutes.start)

  get('/person/:nomsId/court-cases/reference', remandAndSentencingRoutes.getReference)

  post('/person/:nomsId/court-cases/submit-reference', remandAndSentencingRoutes.submitReference)

  get('/person/:nomsId/court-cases/warrant-date', remandAndSentencingRoutes.getWarrantDate)

  post('/person/:nomsId/court-cases/submit-warrant-date', remandAndSentencingRoutes.submitWarrantDate)

  get('/person/:nomsId/court-cases/court-name', remandAndSentencingRoutes.getCourtName)

  post('/person/:nomsId/court-cases/submit-court-name', remandAndSentencingRoutes.submitCourtName)

  get('/person/:nomsId/court-cases/next-court-date-question', remandAndSentencingRoutes.getNextCourtDateQuestion)

  post(
    '/person/:nomsId/court-cases/submit-next-court-date-question',
    remandAndSentencingRoutes.submitNextCourtDateQuestion,
  )

  return router
}
