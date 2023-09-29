import { type RequestHandler, Router } from 'express'

import asyncMiddleware from '../middleware/asyncMiddleware'
import CourtCaseRoutes from './courtCaseRoutes'
import { Services } from '../services'
import ApiRoutes from './apiRoutes'
import OffenceRoutes from './offenceRoutes'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function routes(services: Services): Router {
  const router = Router()

  const get = (path: string | string[], handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const post = (path: string | string[], handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const remandAndSentencingRoutes = new CourtCaseRoutes(services.courtCaseService)
  const apiRoutes = new ApiRoutes(services.prisonerService)
  const offenceRoutes = new OffenceRoutes(services.courtCaseService, services.offenceService)

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

  get('/person/:nomsId/court-cases/next-court-date', remandAndSentencingRoutes.getNextCourtDate)

  post('/person/:nomsId/court-cases/submit-next-court-date', remandAndSentencingRoutes.submitNextCourtDate)

  get('/person/:nomsId/court-cases/check-answers', remandAndSentencingRoutes.getCheckAnswers)

  post('/person/:nomsId/court-cases/submit-check-answers', remandAndSentencingRoutes.submitCheckAnswers)

  get('/person/:nomsId/court-cases/:courtCaseReference/overview', remandAndSentencingRoutes.getCourtCaseOverview)

  get('/person/:nomsId/court-cases/:courtCaseReference/offence-date', offenceRoutes.getOffenceDate)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-offence-date', offenceRoutes.submitOffenceDate)

  return router
}
