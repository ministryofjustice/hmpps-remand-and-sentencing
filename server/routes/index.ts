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

  const courtCaseRoutes = new CourtCaseRoutes(services.courtCaseService, services.courtAppearanceService)
  const apiRoutes = new ApiRoutes(services.prisonerService, services.manageOffencesService)
  const offenceRoutes = new OffenceRoutes(
    services.courtCaseService,
    services.offenceService,
    services.manageOffencesService,
  )

  get('/', (req, res, next) => {
    res.render('pages/index')
  })
  get('/api/person/:nomsId/image', apiRoutes.personImage)

  get('/api/search-offence', apiRoutes.searchOffence)

  get('/person/:nomsId', courtCaseRoutes.start)

  get('/person/:nomsId/court-cases/reference', courtCaseRoutes.getReference)

  post('/person/:nomsId/court-cases/submit-reference', courtCaseRoutes.submitReference)

  get('/person/:nomsId/court-cases/warrant-date', courtCaseRoutes.getWarrantDate)

  post('/person/:nomsId/court-cases/submit-warrant-date', courtCaseRoutes.submitWarrantDate)

  get('/person/:nomsId/court-cases/court-name', courtCaseRoutes.getCourtName)

  post('/person/:nomsId/court-cases/submit-court-name', courtCaseRoutes.submitCourtName)

  get('/person/:nomsId/court-cases/overall-case-outcome', courtCaseRoutes.getOverallCaseOutcome)

  post('/person/:nomsId/court-cases/submit-overall-case-outcome', courtCaseRoutes.submitOverallCaseOutcome)

  get('/person/:nomsId/court-cases/lookup-case-outcome', courtCaseRoutes.getLookupCaseOutcome)

  post('/person/:nomsId/court-cases/submit-lookup-case-outcome', courtCaseRoutes.submitLookupCaseOutcome)

  get('/person/:nomsId/court-cases/case-outcome-applied-all', courtCaseRoutes.getCaseOutcomeAppliedAll)

  post('/person/:nomsId/court-cases/submit-case-outcome-applied-all', courtCaseRoutes.submitCaseOutcomeAppliedAll)

  get('/person/:nomsId/court-cases/check-answers', courtCaseRoutes.getCheckAnswers)

  post('/person/:nomsId/court-cases/submit-check-answers', courtCaseRoutes.submitCheckAnswers)

  get('/person/:nomsId/court-cases/:courtCaseReference/offence-date', offenceRoutes.getOffenceDate)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-offence-date', offenceRoutes.submitOffenceDate)

  get('/person/:nomsId/court-cases/:courtCaseReference/offence-outcome', offenceRoutes.getOffenceOutcome)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-offence-outcome', offenceRoutes.submitOffenceOutcome)

  get('/person/:nomsId/court-cases/:courtCaseReference/lookup-offence-outcome', offenceRoutes.getLookupOffenceOutcome)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-lookup-offence-outcome',
    offenceRoutes.submitLookupOffenceOutcome,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/offence-code', offenceRoutes.getOffenceCode)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-offence-code', offenceRoutes.submitOffenceCode)

  get('/person/:nomsId/court-cases/:courtCaseReference/offence-name', offenceRoutes.getOffenceName)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-offence-name', offenceRoutes.submitOffenceName)

  get('/person/:nomsId/court-cases/:courtCaseReference/confirm-offence-code', offenceRoutes.getConfirmOffenceCode)

  post('/person/:nomsId/court-cases/:courtCaseReference/submit-confirm-offence', offenceRoutes.submitConfirmOffenceCode)

  get('/person/:nomsId/court-cases/:courtCaseReference/next-hearing-select', courtCaseRoutes.getNextHearingSelect)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-select',
    courtCaseRoutes.submitNextHearingSelect,
  )

  get('/person/:nomsId/court-cases/:courtCaseReference/next-hearing-type', courtCaseRoutes.getNextHearingType)

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-type',
    courtCaseRoutes.submitNextHearingType,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/next-hearing-court-select',
    courtCaseRoutes.getNextHearingCourtSelect,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-court-select',
    courtCaseRoutes.submitNextHearingCourtSelect,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/next-hearing-court-name',
    courtCaseRoutes.getNextHearingCourtName,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-next-hearing-court-name',
    courtCaseRoutes.submitNextHearingCourtName,
  )

  get(
    '/person/:nomsId/court-cases/:courtCaseReference/check-next-hearing-answers',
    courtCaseRoutes.getCheckNextHearingAnswers,
  )

  post(
    '/person/:nomsId/court-cases/:courtCaseReference/submit-check-next-hearing-answers',
    courtCaseRoutes.submiCheckNextHearingAnswers,
  )

  return router
}
